
# The Last 5%


The hardest part of building a good policy is not getting it to work. It is getting it from **95% success rate to 99%**. In robotics, that final gap matters a lot. A policy that works most of the time still requires human supervision because the failures are unpredictable. Once a human is required to constantly monitor and intervene, a large part of the value of autonomous robots disappears. 


Over the past three months, we explored different approaches for improving that final few percent. Instead of completely retraining the model, the focus was on finding ways to make better use of the capabilities the VLA already has. These approaches showed that the final improvements often come from better feedback, better action selection, and learning from experience.


## DSRL


Diffusion-based policies work by starting with random noise and gradually denoising it into an action trajectory. The key idea behind DSRL is that instead of changing the entire diffusion policy, we can learn how to choose better noise inputs that guide the policy toward better actions. DSRL adds a small reinforcement learning policy on top of a frozen diffusion policy. This RL policy observes the current state and predicts a better noise latent, which is then passed into the diffusion model. The diffusion policy still generates the action, but the RL policy learns how to steer it toward higher-reward behaviors.


This has several advantages:

- Avoids expensive fine-tuning of large VLA models
- Reduces catastrophic forgetting
- Requires fewer samples compared to full RL fine-tuning
- Improves action selection by leveraging existing model capabilities

Instead of teaching the model completely new behaviors, DSRL learns how to better access the behaviors the model already knows.


## π0.6 + RECAP


Another approach we explored was π0.6 with RECAP. The main idea behind RECAP is teaching a VLA to improve from its own experience without losing the capabilities it already learned from demonstrations. Instead of only training on human demonstrations, the model learns from a combination of:

- Expert demonstrations
- Autonomous rollouts
- Human interventions

The model is then trained with an advantage signal that tells it whether a behavior was better or worse than expected. This allows the VLA to gradually improve by favoring actions that lead to better outcomes while still maintaining the general capabilities learned from the original model. One of the biggest benefits is that it allows training on data that is not perfectly optimal. Previously, collecting training data often meant trying to create perfect demonstrations. With approaches like RECAP, successful rollouts, mistakes, and corrections can all provide useful learning signals.


This creates a much more scalable improvement loop:


**Deploy → Collect Experience → Evaluate Behavior → Learn From Better Actions → Improve Policy**


## The Challenge of the Last 5%


The biggest lesson from working on VLA improvement was that the final gains are often not about making the model larger. Once a policy is capable of performing a task, the challenge becomes making it consistent.


The last few percent comes from answering questions like:

- How can we select better actions from the model's existing capabilities?
- How can we learn from failures without forgetting previous skills?
- How can we use imperfect real-world experience as training data?
- How can we make the policy improve after deployment?

Methods like DSRL and π0.6 + RECAP approach this problem from different directions. DSRL improves performance by learning how to steer the diffusion process toward better action trajectories. RECAP improves performance by learning from experience, feedback, and higher-quality behaviors.


Both approaches show the same idea:


**The future of robotics is not just training better models. It is building systems that can continuously improve from experience.**


## Summary


The hardest part of VLA development is not reaching a working policy. It is closing the gap between a policy that works sometimes and one that can reliably operate in the real world. Approaches like DSRL and π0.6 + RECAP show that the final improvements often come from better feedback loops rather than simply scaling the model. By improving action selection, learning from rollouts, and using feedback from successes and failures, we can push VLAs closer toward reliable autonomy. The last 5% is where robotics becomes difficult. It is also where the biggest breakthroughs will come from.


### Papers

- [DSRL](https://arxiv.org/pdf/2506.15799)
- [π0.6 + RECAP](https://arxiv.org/pdf/2511.14759v2)
