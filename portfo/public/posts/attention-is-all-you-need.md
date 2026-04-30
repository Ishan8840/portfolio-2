
# Attention Is All You Need


I remember being in elementary school and asking teachers what words meant when I got stuck mid-sentence. They'd tell me to look at the words around it and infer the meaning from context.


That's basically how attention works in a transformer.


We want each token to gather information from other tokens, weighted by their relevance. Each token has a **query** (what it's looking for) and a **key** (what it has). We compute the dot product between a query and the keys of all other tokens, this measures the similarity between what we're looking for and what each token offers. We then apply softmax to turn those similarities into weights, and use them to take a weighted sum of the **values,** what each token actually contributes.


## A worked example


Let's run attention on a 3-token sequence with **d_model = 4**. After embedding "The cat sat", suppose we have:


```plain text
X = [[1, 0, 1, 0],   ← the
     [0, 2, 0, 2],   ← cat
     [1, 1, 1, 1]]   ← sat
```


We project **X** into queries, keys, and values via three learned matrices **Q, K, V**. With sensible weights, you get something like:


```plain text
Q                  K                  V
[1, 0, 2, 0]       [0, 1, 1, 1]       [1, 0, 1, 0]
[0, 2, 0, 2]       [2, 0, 0, 2]       [0, 2, 0, 2]
[1, 1, 2, 1]       [1, 1, 1, 1]       [1, 1, 1, 1]
```


The mental model: **Q** is what each token is looking for, **K** is what each token offers, **V** is what each token contributes if it gets picked.


Now compute **Q @ Kᵀ**, scale by **√d_k = 2**, mask the future, and softmax each row:


| Step           | Row 1 (the)     | Row 2 (cat)     | Row 3 (sat)        |
| -------------- | --------------- | --------------- | ------------------ |
| Raw scores     | [2, 2, 3]       | [4, 4, 4]       | [4, 4, 5]          |
| Scaled by √d_k | [1.0, 1.0, 1.5] | [2.0, 2.0, 2.0] | [2.0, 2.0, 2.5]    |
| Causal mask    | [1.0, -∞, -∞]   | [2.0, 2.0, -∞]  | [2.0, 2.0, 2.5]    |
| Softmax        | [1.00, 0, 0]    | [0.50, 0.50, 0] | [0.27, 0.27, 0.45] |


Those final rows are the **attention weights,** the things you see in attention heatmaps. Each row is a probability distribution over the tokens this position is allowed to look at.


Multiply the weights by **V** to get the output:


```plain text
output = [[1.00, 0.00, 1.00, 0.00],   ← unchanged
          [0.50, 1.00, 0.50, 1.00],   ← blend of 'the' and 'cat'
          [0.73, 1.00, 0.73, 1.00]]   ← weighted blend of all
```


Instead of one big average, transformers use multiple **attention heads**, each with its own weights. Each head can focus on its own thing, syntax, semantics, coreference, positional relations. The outputs of all heads are concatenated, giving the next layer a richer, more detailed representation than a single averaged sum could.


## The problem attention solves


Before transformers, the dominant sequence models were RNNs and CNNs.


The problem with **RNNs** is that they process tokens one by one because of their sequential nature. This prevents parallelization, which makes long sequences slow to train. It also means RNNs struggle with long-distance relationships, information has to travel through many steps, and the signal weakens along the way.


**CNNs** allow training to be parallelized. The problem is that CNNs can only look at a local window (the kernel size). The number of operations needed to relate two distant positions grows with the distance between them.


Transformers solve both issues. Instead of processing tokens one by one, we use **self-attention**: every token looks at every other token in the sequence. No sequential waiting, and any two positions are one step apart.


## The full block: residuals, layer norm, FFN


On top of attention, the transformer block has a few more pieces.


**Residual connections** wrap each sublayer: **x + sublayer(x)**. This helps gradient flow and lets the model learn refinements rather than full transformations from scratch.


**Layer normalization** stabilizes training. The original paper uses post-norm, but most modern implementations use pre-norm:


```plain text
LayerNorm(x + sublayer(x))   → post-norm
x + sublayer(LayerNorm(x))   → pre-norm
```


With pre-norm, the original **x** is preserved through every layer, each block just adds to it. With post-norm, every block applies a LayerNorm to the merged result, which rescales and shifts the signal. Pre-norm also gives the gradient flowing backward a clean path through the residuals.


The other sublayer is a **feed-forward network**. Attention mixes information _across_ tokens; the FFN processes each token's mixed representation _individually_.


## Positional encoding


One catch: attention is permutation-invariant. Without positional information, the model can't tell the difference between "dog bites man" and "man bites dog". The original paper handles this with sine and cosine functions of different frequencies, added to the input embeddings.


Sinusoidal positional encoding is rarely used now. Modern models lean on **rotary position encoding (RoPE)** or **attention with linear biases (ALiBi)** instead.


The original transformer was also designed for translation, an encoder-decoder setup. Today, the dominant variant is **decoder-only** (GPT-style), which keeps just the masked self-attention side of the original architecture.


### KV caching


When a decoder-only model generates text, it produces one token at a time. Naively, each new token would recompute attention over the entire sequence from scratch, including all the keys and values for tokens that haven't changed since the last step. That's wasteful.


The trick: for each token we generate, we cache its **K** and **V** vectors. On the next step, we only compute K and V for the new token and append them to the cache. We still compute a fresh **Q** for the new token (since it's the one doing the looking), but the keys and values it attends to are read from the cache.


This turns generation from quadratic to linear per step. The tradeoff is memory, the KV cache grows with sequence length and quickly dominates GPU memory for long contexts.


### Grouped-query attention (GQA)


Standard multi-head attention gives every head its own Q, K, and V projections. If you have 32 heads, you're storing 32 separate K and V tensors per layer in the KV cache. Painful.


**Multi-query attention (MQA)** went to the other extreme: all heads share a single K and V, with only Q being per-head. Way smaller cache, but quality drops.


**Grouped-query attention** is the compromise that won: heads are split into groups, and each group shares one K and V. So 32 query heads might map to 8 KV heads. You get most of the quality of full multi-head attention with a fraction of the cache size. Llama 2/3, Mistral, and most current open models use GQA.


---


**Paper & Code**

- [_Attention Is All You Need_](https://arxiv.org/pdf/1706.03762)[ — Vaswani et al., 2017](https://arxiv.org/pdf/1706.03762)
- [My Implementation](https://github.com/Ishan8840/nanoGPT)
