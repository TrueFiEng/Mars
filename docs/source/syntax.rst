Deployment scripts
==================

.. note::
   Hey! Thanks for trying out Mars. We are still working on this section, so
   expect more content here in the future.

   While we build the documentation you are welcome to check out the code at
   `our github repository <https://github.com/EthWorks/Mars>`_. Maybe you fancy
   contributing?

Deployment scripts are... well, they are scripts that declare how contracts should be deployed.

Let's learn Mars features syntax by looking at the example.

.. literalinclude:: script_example
   :language: typescript
   :linenos:


Just like any TS file, Mars scripts start with imports. On line 1, we import Mars helper functions that we aim to use in the script.
On second line, we can see import of generated :ref:`artifacts <artifacts>`.

``deploy(options: Options, callback: (deployer: string, config: Config) => void)``
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

On line 4, the ``deploy`` function is called. This is the main entry point of the script.

``options``
"""""""""""

.. code-block:: typescript

   interface Options {
      privateKey?: string
      network?: string
      infuraApiKey?: string
      alchemyApiKey?: string
      outputFile?: string
      gasPrice?: BigNumber
      dryRun?: boolean
      noConfirm?: boolean
      verify?: boolean
      etherscanApiKey?: string
      sources?: string
      waffleConfig?: string
   }

.. note::

   Options passed through code have lower priority than those passed with CLI.

``callback``
""""""""""""

.. code-block:: typescript

   type Callback = (deployer: string, options: ExecuteOptions) => void

.. note::

Function where deployment logic is passed. It may provide an address of the deployer and options of the deployment execution.

``ExecuteOptions``
""""""""""

.. code-block:: typescript

   interface ExecuteOptions extends TransactionOptions {
      network: string
      deploymentsFile: string
      dryRun: boolean
      verification?: {
         etherscanApiKey: string
         jsonInputs: JsonInputs
         waffleConfig: string
      }
   }

.. note::

.. important::

   All transactions will be performed **after** ``callback`` is executed. This means that
   no data is available during runtime. As a consequence, for example ``if`` statements may result in unexpected behaviour.
   To learn more, see :doc:`futures`


``contract(name?: string, artifact: Artifact, constructorArgs?: Array<any>, options?: TransactionOptions): ContractInstance``
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. literalinclude:: script_example
   :language: typescript
   :linenos:
   :lines: 5-10
   :emphasize-lines: 1,2,6

Deploy contract with corresponding ``artifact``, named ``name``. Before performing deploy, mars will check ``deployments.json`` file for already deployed contracts with same name.
If this contract has been deployed previously, it will compare their bytecode. If contract hasn't changed, deploy will be skipped.

.. warning::
   Changing compiler version or optimisation options may result in bytecode change and therefore contract redeploy.

``name``
"""""""""""

First (optional) argument specifies name under which contract will be saved in deployment result file.
If name is skipped, it will be named same as a contract but with lowercase first letter.

``artifact``
""""""""""""

:ref:`Artifacts <artifacts>` of the contract we want to deploy.

``constructorArgs``
"""""""""""""""""""

List of arguments passed to contract's constructor. If constructor is missing or is parameterless, this argument can be skipped.

``options``
"""""""""""

Optional argument that allows to override some parameters of the transaction.

.. code-block:: typescript

   interface TransactionOptions {
      wallet?: Wallet
      gasPrice?: BigNumber
      gasLimit?: number | BigNumber
      noConfirm?: boolean
   }

wallet
   Wallet that will sign the transaction.

gasPrice
   Gas price in gwei

gasLimit
   Gas limit for the transaction. Usually limit is correctly estimated by Mars, but sometimes it needs to be specified explicitly.

noConfirm
   Send transaction without confirmation

``returns``
"""""""""""

:doc:`Future <futures>` ContractInstance, i.e. contract that will get eventually deployed. We can perform transactions on this contract, call view functions and pass it as argument.
To be more precise, we can only declare our intent of doing so (remember, nothing is yet deployed when deploy script is executed)

.. hint::
   With every state-changing transaction, Mars will print message similar to this:

   .. code-block:: bash

      Transaction: Deploy apple
         Fee: $1.01, Ξ0.000875217
         Balance: $728.54, Ξ0.630241122
      ENTER to submit, Ctrl+C to exit...

   If you don't want to confirm every transaction, set ``--yes`` flag.



``createProxy(artifact: Artifact, constructorArgs?: Array<any>, onUpgrade?: MethodCall): ProxyFactory``
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Create factory allowing us to deploy `upgradeable contracts <https://blog.openzeppelin.com/proxy-patterns/>`_.
The proxy contract is expected to have ``implementation()`` view method, that will return current implementation's address and a way to change implementation.

``artifact``
""""""""""""

:ref:`Artifacts <artifacts>` of the proxy contract.

``constructorArgs``
"""""""""""""""""""

List of arguments passed to contract's constructor. If constructor is missing or is parameterless, this argument can be skipped.

``onUpgrade``
"""""""""""""""""""

What will happen when contract is upgraded. This may be passed in two ways:

- As a method name (``upgradeTo`` by default)
   When contract behind proxy changes, Mars will call ``upgradeMethod(newImplementation)``
- As a callback (proxyContract) => void
   When contract behind proxy changes, the callback with current proxy instance will be called

``returns``
"""""""""""

Function ``proxyFactory(name?: string, contract: ContractInstance, initializer: MethodCall, args: Array<any>)``

This function takes contract and hides it behind proxy. ``initializer`` is function that will be called only once, when proxy is first deployed. Initializer's format is similar to ``onUpgrade`` of ``createProxy``.
``args`` is a list of arguments passed into initializer.

.. hint::
   If implementation lacks initializer, pass empty function instead ``() => {}``.

.. note::
   If ``name`` is missing, proxy will be named ``{contractName}_proxy``


``runIf(predicate: Predicate, action: () => void)``
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Since we don't get results of our actions during runtime, we cannot do any logic using build-in Javascript expressions (like ``if`` or ``switch`` statesments).
That's where ``runIf`` function comes with rescue. The way it works is very simple: if ``predicate`` is true, it executes ``action``; otherwise it checks ``else`` calls.

.. code-block:: typescript

   runIf(someFutureBoolean, () => /* some action */)
      .elseIf(someFutureNumber.equals(2), () => /* another action */)
      // stops if someFutureNumber == 2
      .elseIf(false, () => {})
      .else(() => /* executes only if every predicate was false */)

``debug(...messages: any[]```
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

If we want to print some results of deployment process, we probably don't want to use normal ``console.log`` s.
After all, we will send our first transaction only after console.logs are executed. That's where ``debug`` is handy - it takes any amount of :doc:`Future <futures>` or not values and
formats them nicely and prints only during deployment process.
