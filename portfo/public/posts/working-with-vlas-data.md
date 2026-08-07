
# Data Is More Influential Than Most Think


When I first started working with VLAs, I thought most of the work would be around optimizing training parameters, architectures, and inference. Over the past three months, I realized that the biggest improvements actually came from two things: **data and inference**.


This post focuses on the first one: **why the quality and diversity of your data can matter more than simply collecting more of it.**


## Data Is the Entire Product


After having to build the entire data collection stack from the ground up and collect hundreds of teleoperated demos, you quickly realize that data collection is one of the biggest bottlenecks for iteration and scaling. Switching to UMI-style collection helped a lot with the speed at which we could collect data, but there was still a bigger issue. We needed the right data.


## Quality > Quantity


One of the biggest things I learned was that **the quality and diversity of your data is often more important than the amount of data you have.**


For example, suppose you want to train a simple pick and place policy. You could collect 100 demonstrations where the object starts in exactly the same location every time. At first, this seems like an easy problem for the policy to learn. In reality, this can hurt performance quite a lot. The policy can end up learning to copy the exact behavior from the demonstrations instead of learning how to generalize to different object locations. You end up with a policy that works really well when the object is exactly where it expects it to be, but fails as soon as you move it somewhere else. In practice, 50 demos from a variety of object locations can be much more useful than 100 demos from the exact same location. The goal isn't just to collect more demonstrations. It's to collect demonstrations that **increase the range of situations the policy can handle.**


## Failure Data Is Often More Valuable


Another big improvement I noticed came from collecting **error recovery and intervention data**.


When training a cube stacking policy, we initially collected around 50 episodes of the same motion from the same starting pose, while varying the cube positions. The policy became pretty good at picking up the cube, as long as it got the first grasp. But as soon as something went wrong, it had no idea what to do. There was basically no regrasp data, so the policy never learned that it could open the gripper, reposition itself, and try again.


We then collected only around 15 additional demonstrations where we started from different gripper positions and specifically collected recovery behavior. This improved the policy's success rate by around **20%**.


This was when I started thinking about data collection differently.

> **The most useful data isn't always another successful demonstration. Sometimes it's a demonstration of what to do when things go wrong.**

This is also why I think fast iteration is so important. Collecting 50 episodes, training a policy, seeing where it fails, and then collecting targeted data will usually get you to a good policy faster than collecting 100 episodes and hoping you can get everything right the first time.


## DAgger-Style Intervention Data


We saw something similar with our laundry folding policy. Instead of only collecting human demonstrations, we let the policy roll out and intervened whenever it started to fail. This gave us much more targeted data because we were collecting demonstrations specifically around the states where the policy was struggling. This improved our towel grasping by around **12%** and increased throughput by **1.3×**. We also tried fine-tuning directly on rollout and intervention data. In our case, this resulted in a slower policy that learned more suboptimal behavior. The bigger lesson for me was that intervention data is useful because it lets you collect examples of failure modes that you would probably never think to demonstrate manually.


## Filtering Data With WARP-RM


A big upgrade to this workflow was using **WARP-RM**. A data filtering method that learns a progress model to figure out which parts of demonstrations are actually useful and which parts are mostly stalled progress. This lets you be a lot less strict about the data you collect. Instead of only trying to collect perfect demonstrations, you can collect broader rollouts, including imperfect ones, and use the filtering model to determine what parts are actually useful for training.


The workflow becomes something like:


**Collect → Filter → Train → Deploy → Find Failures → Collect Targeted Data → Repeat**


This is much more scalable than trying to make every single demonstration perfect.


## Data Augmentation Matters Too


Another thing that surprised me was how much small changes to data augmentation could matter. By default, OpenPI applies augmentations like random cropping, hue changes, and angle distortion to the camera views. When we were A/B testing our setup, we noticed that random cropping wasn't being applied to the wrist camera views in the same way as the overhead camera. After applying the same augmentation to the wrist cameras, we saw a noticeable improvement when using UMI-style data and transferring the policy to the real arms. It's a relatively small change, but it made a noticeable difference. This was another reminder that the data pipeline itself can have a huge impact on the final policy.


## The Real Data Loop


The biggest change in my thinking was moving away from:


**Collect a huge dataset → Train → Hope it works**


and toward:


**Collect → Train → Deploy → Find failures → Collect targeted data → Retrain**


Every time you deploy a policy, you learn something about what the policy is missing. If it fails when the object is in a new location, collect that variation. If it gets stuck after a failed grasp, collect recovery data. If it struggles with a particular camera view, look at the data and augmentation pipeline. The dataset becomes a representation of the policy's weaknesses.


## Summary


The biggest takeaway from working with VLAs is that **the model is only as good as the experience it learns from.** Architecture improvements and training techniques are important, but some of the fastest improvements come from understanding what data the policy actually needs.


Building a strong policy isn't just about collecting thousands of perfect demonstrations. It's about creating a continuous feedback loop:


**Deploy → Observe → Find Failure → Collect Targeted Data → Retrain**


In many ways, data collection becomes the core research loop. Every failure tells you something the policy is missing, and every iteration gives you a chance to fix it. The goal isn't to collect the most data. It's to collect the right data.


### Papers

- [WARP-RM](https://arxiv.org/pdf/2606.28320v1)
- [UMI](https://arxiv.org/pdf/2402.10329)
- [DAgger](https://arxiv.org/pdf/1810.02890)
