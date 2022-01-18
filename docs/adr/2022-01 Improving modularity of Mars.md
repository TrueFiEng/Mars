# Improving modularity of Mars

## Status

Draft

## Context

### Modularity and too many `if` conditionals

An attempt to introduce multisig (batched transactions) deployment into Mars uncovered areas of rigidity in its design.
Plugging in such an extension or feature should not lead to violating open-closed principle from
[SOLID](https://en.wikipedia.org/wiki/SOLID). In the attempt made significant number of existing code areas had to be
modified with conditional blocks which made the whole design overly complex (high code coupling). Therefore, discussion
started about an option to improve the design allowing for loose coupling and improved modularity.

The ultimate goal is to add functionality as follows:

```ts
// old code
deploy(() => {
  const plumToken = contract('plum', Token, ['Plum', 'PLM'])
  const tomatoToken = contract('tomato', Token, ['Tomato', 'TMT'])
  contract(Market, [plumToken, tomatoToken])
})

// adding a new feature - multisig deployments
deploy(() => {
  withMultisig(() => {
      const plumToken = contract('plum', Token, ['Plum', 'PLM'])
      const tomatoToken = contract('tomato', Token, ['Tomato', 'TMT'])
      contract(Market, [plumToken, tomatoToken])
  })
})
```

And codebase internals should accept such a new feature in a simple manner e.g.:

```ts
mars.deploymentTxCreator = new MultisigDeploymentTxCreator(config)
mars.txDispatcher = new MultisigTxDispatcher(config)
// so, it allows to replace particular behaviors with composable building blocks
```

### Main values of Mars so far

1. Deployment of contracts from ABIs
2. Handling of proxies (deployment, upgrades, initialization)
3. Detecting diffs between developed in the repo contracts and those deployed previously to the network
4. Contract verification on Etherscan
5. Existence of Future type allows to pre-build the queue of steps (building phase) to be executed (execution phase) later

Existence of `Future` construct is not mandatory for all the other functionality - it offers an added value though.

### Engine

Currently, all the syntax like `contract(...)`, `createProxy(...)`, `proxy(...)`, `runIf(...)` works as follows:

[Sequence diagram](./uml/2022-01%20Building%20vs%20executing.iuml)

### Proxies

If a proxy detects its underlying implementation contract got changed, it tries to upgrade to the address of the new
implementation. There is a known issue (especially complex in multisig mode) when a proxy needs to know its current
implementation contract address and queues a read operation and eventually subsequent upgrade operation. In multisig

Another all known proxy variants (EIP1967 or custom with parameterless constructor) are hardcoded into the proxy
whereas there should be composable/pluggable means to provide user defined proxy behavior (e.g. the strategy of
getting an underlying implementation).

Below there is a lifecycle of proxy contract handling in Mars:

TODO: diagram of proxy lifecycle (EIP and custom)

### Futures

The current documentations of Mars [states](https://ethereum-mars.readthedocs.io/en/latest/futures.html):

> Futures allow the entire deployment script to be evaluated before the deployment itself happens.
> Futures are a declarative way to describe how values will be manipulated in the future.
> Intuitively you can think about them as “promises without await”.

and

> By removing the asynchronous evaluation we are able to identify a lot of issues with the script before anything is run.
> Suppose that the token didn’t have an approve method. In ethers we would only know after we deployed the contract
> and queried for the balance. However because Futures are synchronous the code token.approve(...) is run before any
> smart contract interaction, throwing an error early and saving us money.

The main principle is to provide ability to build a structure of steps completely and only later execute in the network.
Compare:

TODO: diagram showing Queue or AST vs sequential run

There is a cost though -> it increases the complexity and reasoning about the flow of program execution. This pertains
to 2 development workflows: building the script and debugging its execution.

Consider the following issue of conditional blocks:
```
let currentImplementation = new Future(() => constants.AddressZero)
runIf(getCode(proxy[Address]).equals('0x').not(), () => {

  // NOTE!!! Regardless of the condition value in IF, the value of currentImplementation is set to
  // Future<string> of getImplementation(proxy)
  // If the condition in IF is false, the currentImplementation is unresolved future instead of constants.AddressZero
  currentImplementation = getImplementation(proxy)
})
```
For JS/TS programmers the above result is very unintuitive and leads to errors.

It seems the same value could be achieved in a simpler way. First by generating the typed contract definitions
(via Mars future-free generate or typechain) and next to execute the script configuring a subset of behaviors:
- a run against in-memory Ganache or just collect transactions in the queue
- a run that visualizes the execution tree
- a run that verifies the contracts only
- a run that computes diffs between developed contracts in the repo and those already deployed

Then the expression system does not mix with JS/TS language constructs and is very deterministic.
We then loose though the full structure of queue (or AST) containing all the steps that could be potentially applied to
the network.

### Solution 'Simple'

Abandoning futures, generating bindings and providing the bare utility: deployment, proxies, diffs, verification
in a pluggable/extendable/composable fashion.

Modularity as follows:

TODO: diagram

Pros:
- very simple code structure and intuitive debugging -> nicer learning curve for newcomers
- easier to maintain extendable architecture and create extensions
Cons:
- without the complete tree of actions we cannot provide static-like analysis of execution

#### How to get there

1. Parametrize generation of artifacts and generate future free artifacts (or use typechain instead)
2. Extraction of static utility functions (when no state) or classes (when state is natural) for deployment, diffs, verification etc.
3. Abstracting away cross-cutting concerns like logging, console interaction or saving into files
4. Creating a new execution pipeline with extensions points (abstract strategies to plugged in like transaction dispatcher etc.)
5. Mirroring existing syntax (`contract`, `createProxy` etc.) (except `runIf`` conditionals as not needed) that
redirects to the new execution pipeline

CLI should not be changed at first as we change only the underlying implementation.

### Solution 'AST'

#### How to get there

### Solution 'Hybrid'

The execution pipeline of solution 'Simple' can coexist with 'AST'. The common part would be the logical building blocks
and deployment script builders might choose one accordint to their need/preferences.

Potentially 3 packages:
1. ethereum-mars-core
2. ethereum-mars
3. ethereum-mars-futures

#### How to get there

1. Follow Solution 'Simple' but build alongside (e.g. do not delete future-enabled generation process)
2. Build Solution 'AST' reusing the building blocks from point 1
3. Setup package publishing

## Decision

## Consequences
