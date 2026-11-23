---
title: TinyDreamer
slug: tiny-dreamer
date: "2026-11-22"
description: What I learned building a minimal version of Dreamer
tags: [world models, reinforcement learning, MinAtar]
---
# TinyDreamer

In Breakout, the ball hits a brick and the game awards a point. I could replay the same actions inside my world model, watch it draw a plausible game of Breakout, and still see it miss the point. That mistake mattered twice. During training, that imagined reward helped shape both the actor’s choice of actions and the critic’s estimate of what a position was worth.

I built TinyDreamer, a roughly $550{,}000$-parameter Dreamer-style agent, to understand how a policy learns from games played in imagination. The missed brick gave me a more specific question. Could the agent tell which parts of an imagined game it should trust?

## Following one imagined decision

I wrote the agent in JAX and trained separate weights for each of the five MinAtar games. To follow a decision in Breakout, start with a few frames from the real game. The tokenizer compresses each screen into a vector, or *latent*. The actor chooses an action, and the world model predicts three things: the next latent, the reward, and the probability that the episode continues. On the next imagined step, the model has to work with the latent it just produced. A small error in the ball’s position can become part of the history behind every subsequent prediction.

You can follow that path through the diagram below. Open the tokenizer to change the latent of a recorded Breakout frame and see what the decoder draws.

[Interactive TinyDreamer architecture](/writing-assets/tiny-dreamer/explorer/)

## Keeping the ball on track

I started with a demanding test. Given the same starting frames and actions as the real game, how often could the model get *every frame* right for $20$ steps? Adding QKNorm, which normalizes the queries and keys in each attention head, raised that rate from **$18.6\%$ to $27.5\%$** on the same Breakout starting points. Most rollouts still contained a mistake, but two extra learned parameters bought enough additional perfect trajectories that I kept them.

I also changed what the model saw during training. My first world model learned from random play. As the actor improved, it visited situations that appeared infrequently in that dataset. I let the actor play real games and added those transitions to replay for the world model. The actor and critic continued to learn from imagined trajectories.

Reward events posed a different sampling problem. A replay window could contain plenty of movement and very few points. In the five-game run, each reward-head update drew $16$ positive-reward transitions and $48$ zero-reward transitions, with weights accounting for each group’s frequency in replay. Compared with the earlier runs using natural frequencies, the largest score increases were in Space Invaders, from $26.16$ to $52.32$, and Breakout, from $9.48$ to $14.39$.

Even with better coverage, an imagined history gradually fills with the model’s own errors. I tried *diffusion forcing* to give the predictor practice with imperfect histories: during training, individual frames in its context received different amounts of noise. I then replayed the same Breakout actions from the same starting positions and measured the mean distance, in grid cells, between the imagined ball and the real one.

| Frames ahead | Clean-history training | Diffusion forcing |
| ------------ | -------: | ----------------: |
| $+1$ frame   |   $2.02$ |            $2.08$ |
| $+5$ frames  |   $4.55$ |            $4.72$ |
| $+10$ frames |   $4.57$ |            $3.60$ |
| $+20$ frames |   $4.97$ |            $3.80$ |

At one frame ahead, the clean-history model placed the ball slightly closer to its real position. At $20$ frames, diffusion forcing brought the error down by more than a full grid cell. If I’d stopped the comparison after the next frame, I would have chosen the model that lost track of the ball by the wider margin later on.

## Could the model tell when it was wrong?

The Breakout comparison let me measure drift after the game. During imagination, the actor has to choose its next action before it gets to see the real frame. In Asterix, I trained a small prediction head, or *probe*, to estimate how far an imagined latent had drifted. To give it a training target, I replayed recorded actions, encoded the real frame at each step, and measured the mean squared error (MSE) between that latent and the predicted one.

I tested the probe on $512$ fresh episodes. At the third imagined step, I split the predictions into groups using the risk the probe estimated before seeing the real frame. Then I checked two things against the recording: how far the latent had drifted, and whether the model had missed a coin pickup or invented one.

| Metric at step $3$ | Low predicted risk | High predicted risk |
| --- | ---: | ---: |
| Actual latent MSE | $0.814$ | $1.415$ |
| Coin-event mistakes | $0.65\%$ | $2.00\%$ |

The probe picked out a group with larger latent errors and roughly three times the rate of coin-event mistakes. But real pickups were also more common in that group. A rule that stopped imagination whenever the probe flagged a step could throw away the moment the actor was trying to learn about.

I compared three ways to handle that uncertainty. One policy always trained on five imagined steps. A second stopped at the first step the probe flagged. A third kept the step and reduced its influence gradually. For that last policy, a sigmoid gave a predicted MSE of $0.887$ a trust weight of $0.90$. At $1.214$, the weight fell to $0.50$. As trust fell, the return target moved closer to the critic’s existing estimate, reducing the influence of the imagined outcome on both the actor and the critic.

I took all three policies back into real Asterix games and measured the points they earned per episode.

| Rule used in training | Mean points per episode |
| ------------------------ | ------------------: |
| Fixed five steps         |             $1.075$ |
| Hard cutoff              |             $1.027$ |
| Soft weighting           |             $2.52$ |

With this seed, the hard cutoff scored about the same as always taking five steps. Soft weighting reached $2.52$ points per episode. My reading is that the probe could identify a difficult prediction while the imagined transition still carried information worth learning from.

## Taking the policies back into the games

The final test was to let each imagination-trained policy control the real game. Each row compares its mean points per episode with a random policy playing under the same scoring system.

| Game | Random policy | Imagination-trained policy |
| -------------- | -----: | -------: |
| Breakout       |   0.43 |    14.39 |
| Freeway        |   0.41 |    17.32 |
| Space Invaders |   3.90 |    52.32 |
| Asterix        |   0.55 |    2.52 |
| Seaquest       |   0.11 |     1.82 |

All five policies beat random play. The scores also put the earlier experiments in perspective. In Breakout, I could follow a single missed reward all the way back to the ball’s position. In Asterix, even the best of the three imagination rules averaged only a few points per game. Knowing where the model was unreliable helped me decide how much weight to give its predictions. It still left the actor with a hard game to learn.

## Conclusion

Before building TinyDreamer, I understood the Dreamer loop well enough to sketch it. What I learned by implementing it was how to debug a decision inside that loop. For a missed point, I could check the encoded screen, follow the ball through the imagined frames, and see which reward reached the critic. The Asterix probe gave me a partial answer to the question that started the project: the model could flag steps where its predictions tended to be worse, and in this run the actor did better when it could still learn from them.

Scaling is the experiment I didn’t get to run. I’d start larger world models from the same recorded positions and measure how far each could imagine before it misplaced a ball or missed a pickup. Then I’d time those rollouts. That would tell me what a larger model actually buys the actor: how many more steps of useful experience it can generate, and what each one costs.

## Sources

**Implementation**

[TinyDreamer on GitHub](https://github.com/Ishan8840/tiny-dreamer)

**Research papers**

- **Dreamer** · [Dream to Control: Learning Behaviors by Latent Imagination](https://arxiv.org/abs/1912.01603)
- **DreamerV2** · [Mastering Atari with Discrete World Models](https://arxiv.org/abs/2010.02193)
- **DreamerV3** · [Mastering diverse control tasks through world models](https://doi.org/10.1038/s41586-025-08744-2)
- **Dreamer 4** · [Training Agents Inside of Scalable World Models](https://arxiv.org/abs/2509.24527)
