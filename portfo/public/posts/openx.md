
# Open X-Embodiment: Robotic Learning Datasets and RT-X Models


## The five fields

- Action representation: Canonical 7-DoF end-effector format (x, y, z,
roll, pitch, yaw, gripper). All contributing robots' native action
spaces are mapped into this shared format. RT-1-X and RT-2-X use the
same 256-bin discretization as their non-X versions.
- Backbone: Two models retrained: RT-1-X (35M, RT-1's transformer) and
RT-2-X (PaLI-X 5B and 55B variants). No new architecture the paper
is primarily about the dataset.
- Data mixture: ~1M trajectories from 22 robot embodiments at 21
institutions. ~500 skills, ~150k task instructions. Weighted sampling
during training to balance dataset sizes (downweight largest, upweight
smallest). Pure robot data, no web co-training in this paper.
- Control freq / latency: Inherits from underlying models RT-1-X at
3 Hz, RT-2-X at 1-3 Hz. Not the focus of the paper.
- Central claim: Pooling robot data across many embodiments and training
a single model on the union improves performance on each individual
embodiment, beyond what training only on that embodiment's data
achieves positive cross-embodiment transfer.

## What's new vs. RT-2

- New dataset: Open-X, the first large-scale cross-institutional
cross-embodiment robot dataset, released openly in RLDS format.
- New empirical finding: positive cross-embodiment transfer training
a single model across diverse robots helps each robot's performance.
- Establishes RLDS as the de facto standard data format for robotics.
- Establishes the canonical 7-DoF end-effector action space as the
cross-embodiment lingua franca for manipulation.
- The retrained RT-X models slightly outperform the original RT-1
and RT-2 on standard benchmarks, validating the data is genuinely
useful (not just bigger).

## Key design choice + why


Canonical 7-DoF end-effector action space. By forcing all robots'
actions into this shared format, the paper enables a single model
to learn from heterogeneous robot data with one output head. The
choice trades per-robot precision (you lose the original joint
configuration info, downstream IK has to recover it) for cross-
embodiment compatibility. Without this choice, the cross-embodiment
training story doesn't work,  it's the engineering glue holding
everything together.


## Most important findings

1. Positive cross-embodiment transfer. Each robot benefits from
training alongside data from other robots, not despite it. The
shared visual and semantic representations transfer; action
decoding specializes.
2. Data balancing matters. Naive uniform sampling lets large datasets
dominate. Weighted sampling produces meaningfully better results.
3. The dataset is sufficient for state-of-the-art. RT-2-X (RT-2
trained on Open-X) outperforms the original RT-2 trained on
Google-internal data alone.
4. Cross-institutional collaboration works. The paper is a proof-of-
concept that robotics labs can productively pool their data
without losing their individual research priorities.

## Limitations

- Canonical 7-DoF action space loses information for high-DoF or
morphologically unusual robots. Quadrupeds, humanoids, dual-arm
systems are awkward fits.
- Data quality varies wildly across contributing datasets. Some
sub-datasets are noisy or have nonstandard conventions.
- Transfer is strongest within similar embodiment categories (arm
to arm) and weaker across very different ones (arm to quadruped).
- Doesn't address the inference speed problem, the X variants are
just as slow as their parents.
- Manipulation-focused. Less coverage of locomotion, navigation,
bimanual coordination.

[http://arxiv.org/abs/2310.08864](http://arxiv.org/abs/2310.08864)

