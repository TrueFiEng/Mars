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

![Building vs executing](http://www.plantuml.com/plantuml/proxy?cache=no&src=https://raw.githubusercontent.com/EthWorks/Mars/marcin/redesign-doc/docs/adr/uml/2022-01-Building-vs-executing.iuml)

There are 2 significant parts:

1. Queueing actions and their execution are separated. This allows for complete build up of actions to be instantiated.
2. This requires introducing structs of values that we can declare in build-up time and evaluate later (Futures).

In the above diagram aqua boxes describes creation of such structs (Futures), specifically `(future A) => future B`
tells that the given step depends on availability of value A in the future and resolves the value of B when the step
is completed successfully.

If we remove actions queue and execution engine then are left with direct calls to the network which is very simple
However, during script execution not every action path would be built.

### Proxies

If a proxy detects its underlying implementation contract got changed, it tries to upgrade to the address of the new
implementation. There is a known issue (especially complex in multisig mode) when a proxy needs to know its current
implementation contract address and queues a read operation and eventually subsequent upgrade operation. In multisig
if the proxy we cannot read from non-existing proxy (imagine queuing such a read just after proxy creation landed
in multisig batch and not yet in the network). We need to read if the proxy has been created and only then read
the current implementation. This adds conditional complexity to the proxy handling which is especially entangled
combining with Future structures.

Another problem stems from the fact that all the known proxy variants (EIP1967 or custom) are hardcoded into the proxy
whereas proxying in Mars should offer also:
- replacing the way the current implementation contract address is obtained
- providing an easy way to specify ctor param values (EIP1967) for a specific implementation contract
- constructing a user defined proxy built with some behaviors of Mars default proxy but adding also more (e.g. automatic
ownership transferring or interacting with the old version of the proxy/logic just before upgrade to the new one)

Below there is a lifecycle of proxy contracts handling in Mars:

![Proxies lifecycle](http://www.plantuml.com/plantuml/proxy?cache=no&src=https://raw.githubusercontent.com/EthWorks/Mars/marcin/redesign-doc/docs/adr/uml/2022-01-Proxies.iuml)

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

### Improving modularity

Regardless of keeping Futures or not, we want Mars be composable/extendable in 2 ways:

1. It should offer basic utility building blocks (e.g. contract diff, deployments, proxies) to be used to construct custom
pieces (custom proxies, deployment schemes etc.)
2. It should offer extension points (e.g. plugging in a specific strategy e.g. multisig batching and execution)

![Modularity](http://www.plantuml.com/plantuml/proxy?cache=no&src=https://raw.githubusercontent.com/EthWorks/Mars/marcin/redesign-doc/docs/adr/uml/2022-01-Modularity.iuml)

### Solution 'Modular step by step'

Note! This solution is orthogonal to other solutions below. It addresses modularity problem and other solutions address
Future struct complexity. It is recommended to pick this solution + any of the solutions below.

1. Extracting transaction dispatching and abstract away behind some gateway.
2. Extract contract creation strategy (CREATE vs CREATE2) and make it configurable/replaceable.
3. Extract deployments file reading/saving.
4. Extract existing deployment information retrieval and provision it for actions building phase (now it is available
only in the execution phase).
5. **Implement multisig module as extension to the main process.**
6. **Make sure multisig module abstracts away its particular implementation, e.g. Gnosis Safe**
7. Extract verification and abstract away etherscan verification API behind a gateway

### Solution 'Simple'

Abandoning futures, generating bindings and providing the bare utility: deployment, proxies, diffs, verification
in a pluggable/extendable/composable fashion.

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
5. Mirroring existing syntax (`contract`, `createProxy` etc.) (except `runIf` conditionals as not needed) that
redirects to the new execution pipeline

CLI should not be changed at first as we change only the underlying implementation.

### Solution 'AST'

Replacing actions queue with Abstract Syntax Tree and executeX functions with composable visitors should improve
the overall design by make it more loosely coupled, thus extendable without the risk of modification of existing parts.

#### How to get there

1. Improve modularity first, see Solution Modular
2. Replace actions queue with AST where `createProxy` syntax node consists of smaller building blocks like DEPLOY, READ,
UPGRADE_TO. This is useful to represent block wrappers like `runIf` or `withMultisig`.
3. Replace `executeX` functions with composable visitors (each traversing the tree and doing one specific job).

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
