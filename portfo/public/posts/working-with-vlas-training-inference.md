
# Training + Inference


When working with VLAs, a lot of the improvements do not come from simply training a bigger model or collecting more data. A large part of the challenge is making sure that what the policy predicts actually translates into smooth, reliable robot behavior. Over the past few months, I found that many of the biggest improvements came from better action representations and inference optimizations. These techniques help bridge the gap between what the model wants the robot to do and what the robot can actually execute in the real world.


## Action Representation


There are three main ways to represent actions: **absolute actions, delta actions, and relative delta actions.**


### Absolute Actions


Absolute actions directly predict the target position of the robot joints or end effector. The main advantages are that they are precise for fixed tasks, do not accumulate error over time, and are easy to interpret. However, they have some important drawbacks.

- Poor generalization to new environments
- Less smooth control
- Harder for the model to learn
- Small offsets can result in large execution errors

Absolute actions work well when the robot environment is highly controlled, but they struggle when there are small changes in calibration, object position, or starting state.


### Delta Actions


Delta actions predict the change from the robot's current position instead of predicting the final target directly. This is generally more common for VLA policies because it matches how robots are often controlled in practice.


Advantages:

- Easier for the model to learn
- Better generalization
- Smoother control
- More robust to calibration errors
- Matches teleoperation data better

However, there are also some downsides:

- Errors can accumulate over time
- Less precise for fixed trajectories
- Requires a strong feedback loop
- Less interpretable
- May require more corrections

The main idea is that instead of learning an exact trajectory, the policy learns how to continuously adjust based on the current state.


### Relative Delta Actions


Relative actions are a variation of delta actions where the movement is anchored to the start of the action chunk.


Instead of predicting:


```plain text
Move +0.1, then +0.1, then +0.1
```


the model predicts the relative position throughout the chunk:


```plain text
Move +0.1, then +0.2, then +0.3
```


The main advantage is that the model learns the intent of the movement rather than memorizing exact distances from a specific environment.


Benefits:

- More scale-invariant
- Better generalization
- Adapts better to different object sizes and distances
- More consistent across demonstrations

This is why relative actions have become popular in newer VLA systems like π0.5. They make it easier for policies to transfer across different robots and environments.


## Mixture of Horizons


Most VLAs use action chunking instead of predicting a single action at a time. The model predicts a sequence of future actions and the robot executes them. This allows the robot to maintain a higher control frequency, but there is an important tradeoff: **how long should the action chunk be?**


A fixed chunk size is not ideal. For example, fine-grained manipulation tasks like grasping or aligning objects require high precision and fast corrections. These tasks benefit from shorter action chunks. However, larger movements like approaching an object or moving between locations do not require the same level of precision. They can use longer chunks. Mixture of Horizons solves this by allowing the policy to dynamically choose the action horizon during inference. Models like π0.5 use a learnable gating mechanism that decides when to use shorter or longer action chunks. This improves performance on tasks that require reactive behavior and small corrective movements because the model can become more precise when needed.


## Latency Matching


One of the biggest problems when deploying VLAs is that the world the model sees is not the same as the world the robot is currently in. A policy might predict an action based on an observation at time t, but by the time the robot executes that action, the robot is already somewhere else.


There is latency everywhere:

- Cameras have streaming latency
- Robot arms have execution latency
- Grippers have response delays
- Communication adds additional delay

π0.5 assumes that actions are executed immediately, but real robots do not work this way. Latency matching solves this by sending commands ahead of time. For example, if the robot has 100ms of execution latency, then at time t, we send the command that the policy predicted for t + 100ms. This aligns the policy's prediction with the actual state the robot will reach when the command is executed. Without latency matching, even a good policy can appear unstable because it is constantly acting on outdated information.


## Real-Time Chunking (RTC)


Action chunking policies predict a block of actions and then execute them. However, generating the next chunk is not instant. There is always a delay caused by inference time. RTC solves this by running inference for the next chunk while the robot is still executing the current chunk. The challenge is that some of the current action chunk will already have been executed by the time the new chunk is ready.


RTC handles this by:

1. Freezing the actions that have already been executed
2. Using those actions as a fixed prefix
3. Generating the remaining part of the new chunk
4. Blending the two together smoothly

The process is similar to image inpainting. The frozen actions are the known region, and the model generates the missing actions around them. A mask is used to smoothly transition between the old and new chunk, preventing sudden jumps or jerky movements.


## Cubic Interpolation


A simple way to increase the throughput of a chunking policy is using cubic interpolation. Instead of directly executing every predicted waypoint, we fit a cubic spline through the sequence of actions and resample it at a faster rate. The benefit is that cubic splines maintain continuous velocity, meaning the robot motion remains smooth even when sped up. However, there is a tradeoff. Increasing the speed also increases the required velocities and accelerations, which can:

- Push actuator limits
- Reduce precision
- Affect timing-sensitive tasks

For example, actions like releasing an object at exactly the right moment can become harder if the motion timing changes too much.


## Summary


Through experimenting with different VLA training and inference techniques, I found that many of the biggest improvements came from making the policy easier to deploy rather than simply scaling the model. Techniques like relative action representations, mixture of horizons, latency matching, real-time chunking, and trajectory interpolation all solve different parts of the same problem: **the gap between what the policy predicts and what the robot can physically execute.** A VLA can have strong reasoning and good demonstrations, but real-world performance depends heavily on how well the entire system handles latency, control frequency, and execution constraints. The last step toward reliable robot policies is not just improving the model. It is improving the entire pipeline around it.


### Papers

- [Action Chunking with Transformers](https://arxiv.org/pdf/2511.19433)
- [Mixture of Horizons](https://arxiv.org/pdf/2506.07339)
- [UMI](https://arxiv.org/pdf/2402.10329)
- [Real-Time Chunking](https://arxiv.org/pdf/2504.16054)
