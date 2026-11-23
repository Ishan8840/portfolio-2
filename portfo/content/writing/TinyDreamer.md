---
title: TinyDreamer
slug: tiny-dreamer
date: "2026-11-22"
description: What I learned building a minimal version of Dreamer
tags: [world models, reinforcement learning, MinAtar]
---
# TinyDreamer

I built a Dreamer-style agent with roughly $550{,}000$ parameters to understand how a policy learns by acting in imagination. While reading the Dreamer papers, I kept coming back to one question: could an agent learn when to trust its own imagined states?

## Following one imagined decision

I built TinyDreamer in JAX and trained a separate agent for each of the five MinAtar games. Breakout was the easiest place to follow a decision. I could watch the ball hit a brick in the real game, replay the same actions in the world model, and check whether it predicted the point on the right step.

The tokenizer compressed each screen into a vector called a latent. Starting from a short history of real latents, the actor chose an action. The world model then predicted the next latent, the reward, and the probability that the game would continue. If the model missed a brick hit, the actor could learn from the wrong reward even when the rest of the predicted screen looked right.

Click a component to follow the tensors through it and see how it is trained. In the tokenizer, you can edit the latent for a recorded Breakout frame and watch the reconstruction change.

[Interactive TinyDreamer architecture](/writing-assets/tiny-dreamer/explorer/)

## The changes that mattered

**Attention normalization helped over longer rollouts.** I tried QKNorm, which normalizes the queries and keys in each attention head. On the same Breakout starting points, the share of $20$-step rollouts that matched the real game at every frame rose from **$18.6\%$ to $27.5\%$**. Seeing the improvement over a whole trajectory convinced me to keep a change that added only two learned parameters.

**Rare rewards were easy to miss in training.** In the five-game run, I sampled $16$ transitions with a positive reward and $48$ with zero reward for each reward-head update. I weighted the examples to account for how often each group occurred in replay. Compared with earlier runs that sampled transitions at their natural frequencies, the largest score increases were in Space Invaders (from $26.16$ to $52.32$ points) and Breakout (from $9.48$ to $14.39$).

**The world model needed experience from the current policy.** I initially trained the world model on games played by a random policy. As the actor improved, it began visiting states that were rare in those games. I added online collection: the actor played in the real environment, and I added those transitions to replay so the world model could learn from them. The actor and critic still trained on imagined trajectories.

**Diffusion forcing.** I wondered whether a predictor that had only seen clean frames could recover once the ball drifted during imagination. I tried diffusion forcing: during training, I made some frames in its history noisier than others. I wanted to see whether the ball stayed on track farther into a rollout.

I replayed the same Breakout actions from the same starting positions with both models. At each horizon, I measured how far the predicted ball was from its real position, in grid cells. Smaller errors are better.

| Frames ahead | Clean-history training | Diffusion forcing |
| ------------ | -------: | ----------------: |
| $+1$ frame   |   $2.02$ |            $2.08$ |
| $+5$ frames  |   $4.55$ |            $4.72$ |
| $+10$ frames |   $4.57$ |            $3.60$ |
| $+20$ frames |   $4.97$ |            $3.80$ |

In this Breakout test, diffusion forcing slightly increased ball-position error at the first two horizons and reduced it at the longer two. That gave me a reason to evaluate whole rollouts. A one-step comparison would have missed the improvement.

## Teaching a separate head to predict rollout error

In Asterix, I wanted to know whether the model could recognize its own mistakes. I replayed recorded actions and compared each predicted latent with the latent the tokenizer produced from the corresponding real frame. That difference gave me a target for a small error predictor, or probe. On fresh episodes, the probe had to estimate the error before it saw the real frame.

Did the probe flag steps where the model made bigger mistakes? Across $512$ fresh episodes, I grouped predictions by the probe’s estimated risk at the third imagined step. Latent mean squared error (MSE) was higher in the high-risk group, and the model more often missed a coin pickup or predicted one that never happened. Actual pickups were also more common in that group. Cutting off every high-risk rollout could discard some of the most useful examples.

| Metric at step $3$ | Low predicted risk | High predicted risk |
| --- | ---: | ---: |
| Actual latent MSE | $0.814$ | $1.415$ |
| Coin-event mistakes | $0.65\%$ | $2.00\%$ |

I compared three ways to train the policy: always use five imagined steps, stop at the first high-error step, or reduce each step’s weight as predicted error rises. For the last approach, I used a sigmoid that assigned a trust weight of $0.90$ at a predicted MSE of $0.887$ and $0.50$ at $1.214$. Lower trust moved the return target closer to the critic’s current estimate and gave that step less influence on both the actor and the critic.

To see how those rules affected play, I compared the points each policy earned in real Asterix episodes.

| Rule used in training | Mean points per episode |
| ------------------------ | ------------------: |
| Fixed five steps         |             $1.075$ |
| Hard cutoff              |             $1.027$ |
| Soft weighting           |             $2.52$ |

With this training seed, soft weighting scored higher than the hard cutoff. My interpretation is that even an uncertain step can contain useful information about a pickup.

## Results

I evaluated both policies in the real games. Each row shows mean points per episode for one game. The five games award points differently, so read across each row to see how much the trained policy gained over random play.

| Game | Random policy | Imagination-trained policy |
| -------------- | -----: | -------: |
| Breakout       |   0.43 |    14.39 |
| Freeway        |   0.41 |    17.32 |
| Space Invaders |   3.90 |    52.32 |
| Asterix        |   0.55 |    2.52 |
| Seaquest       |   0.11 |     1.82 |

## Conclusion

Tracing a missed point in Breakout helped me understand how learning in imagination works. An error in the imagined ball position can change the predicted reward, which changes the return the critic learns to predict and the feedback the actor receives. In Asterix, the probe gave me a partial answer to my original question: the agent could identify riskier imagined steps, but some of those steps were also where it had the most to learn.

The biggest question I didn’t get to test was scaling. With a larger world model, I’d want to know how many more steps the actor could reliably imagine and how long each decision would take. That trade-off matters in a game or any other task where the agent has to act in real time.

## Sources

**Implementation**

[TinyDreamer on GitHub](https://github.com/Ishan8840/tiny-dreamer)

**Research papers**

- **Dreamer** · [Dream to Control: Learning Behaviors by Latent Imagination](https://arxiv.org/abs/1912.01603)
- **DreamerV2** · [Mastering Atari with Discrete World Models](https://arxiv.org/abs/2010.02193)
- **DreamerV3** · [Mastering diverse control tasks through world models](https://doi.org/10.1038/s41586-025-08744-2)
- **Dreamer 4** · [Training Agents Inside of Scalable World Models](https://arxiv.org/abs/2509.24527)
