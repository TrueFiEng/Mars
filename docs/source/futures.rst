Futures
=======

Why Futures
-----------

When writing deployment scripts one of the very important things is to be
able to identify issues before the script itself is run. One way to do this
is by using the :ref:`dry run <Dry run>` option. Another is to deploy to a
:ref:`test network <CLI flags>`. But those solutions still require running the
script.

Futures allow the entire deployment script to be evaluated before the deployment
itself happens. Futures are a declarative way to describe how values will be
manipulated in the future. Intuitively you can think about them as "promises
without await".

This is how code written using the Ethers library looks like:

.. code-block:: typescript

   const token = await new ContractFactory(ERC20.abi, ERC20.bytecode, deployer).deploy()
   const balance = await token.balanceOf(deployer)
   await token.approve(exchange, balance.div(2))

And this is how a Mars script with Futures looks:

.. code-block:: typescript

   const token = contract('token', ERC20)
   const balance = token.balanceOf(deployer)
   token.approve(exchange, balance.div(2))

By removing the asynchronous evaluation we are able to identify a lot of issues
with the script before anything is run. Suppose that the token didn't have an
approve method. In ethers we would only know after we deployed the contract and
queried for the balance. However because Futures are synchronous the code
:code:`token.approve(...)` is run before any smart contract interaction,
throwing an error early and saving us money.

Creating Futures
----------------

Futures are usually created for you as return values from contract calls. If
you want to create a Future yourself use the static constructor
:code:`Future.create`.

.. code-block:: typescript

   const [future, resolve] = Future.create()

This function returns two values. The first is the newly created future. The second is the resolve callback. Upon creation the Future does not have a value. In order for the future to have a value you need to call the resolve function. Once the Future is resolved you can get
its value by calling the :code:`.resolve()` method on the Future object.

.. code-block:: typescript

   const [future, resolve] = Future.create()
   future.resolve() // throws
   resolve(1234)
   future.resolve() // returns 1234

The :code:`.resolve()` method is very useful if the value you have is a Future. However if you don't know that you can always use :code:`Future.resolve(value)`, which ignores non-futures and resolves Futures.

.. code-block:: typescript

   const [future, resolve] = Future.create()
   resolve(1234)
   Future.resolve(future) // returns 1234
   Future.resolve("pancakes") // returns "pancakes"

Using Futures
-------------

Every future has a :code:`.map(fn)` method that allows you to manipulate its value. Here is an example of it in action.

.. code-block:: typescript

   const [future, resolve] = Future.create()
   const uppercased = future.map(x => x.toUpperCase())
   resolve("pancakes")
   future.resolve() // returns "pancakes"
   uppercased.resolve() // return "PANCAKES"

Using :code:`.map(fn)` is usually a bit cumbersome so the Futures returned from Mars contracts have helper methods to easily manipulate the values.

- :code:`.equals(other)` - performs `===` equality check on the resolved values and returns a FutureBoolean.

FutureBoolean
^^^^^^^^^^^^^

- :code:`.not()` - returns a FutureBoolean with a negated value. Equivalent to the :code:`!` operator.
- :code:`.and(other)` - takes a FutureBoolean or boolean and returns a FutureBoolean. Equivalent to the :code:`&&` operator.
- :code:`.or(other)` - takes a FutureBoolean or boolean and returns a FutureBoolean. Equivalent to the :code:`||` operator.
- :code:`.thenElse(a, b)` - takes two values and returns a Future that will resolve to the first or the second value depending on the underlying boolean (first if true, second if false).

FutureNumber
^^^^^^^^^^^^

.. note::

   FutureNumber is a Future that uses BigNumber from the Ethers library underneath. In this way it is only allowed to hold integer values.

- :code:`.add(other)` - takes a FutureNumber or a number and returns a FutureNumber. Equivalent to the :code:`+` operator.
- :code:`.sub(other)` - takes a FutureNumber or a number and returns a FutureNumber. Equivalent to the :code:`-` operator.
- :code:`.mul(other)` - takes a FutureNumber or a number and returns a FutureNumber. Equivalent to the :code:`*` operator.
- :code:`.div(other)` - takes a FutureNumber or a number and returns a FutureNumber. Equivalent to the :code:`/` operator.
- :code:`.mod(other)` - takes a FutureNumber or a number and returns a FutureNumber. Equivalent to the :code:`%` operator.
- :code:`.pow(other)` - takes a FutureNumber or a number and returns a FutureNumber. Equivalent to the :code:`**` operator.
- :code:`.lt(other)` - takes a FutureNumber or a number and returns a FutureBoolean. Equivalent to the :code:`<` operator.
- :code:`.lte(other)` - takes a FutureNumber or a number and returns a FutureBoolean. Equivalent to the :code:`<=` operator.
- :code:`.gt(other)` - takes a FutureNumber or a number and returns a FutureBoolean. Equivalent to the :code:`>` operator.
- :code:`.gte(other)` - takes a FutureNumber or a number and returns a FutureBoolean. Equivalent to the :code:`>=` operator.
