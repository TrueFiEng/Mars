Introduction
============

The old way
-----------

Prior to Mars three approaches for managing deployments existed.

The first was to deploy the smart contracts by hand. While it allowed the most
degrees of freedom, this approach was very difficult and error prone.

A better way was to write a custom deploy script for your project. Such a
solution while automating a lot of the work was not without its downsides.
Scripts like this were hard to test and reason about. Also, if you made an error
at the end of the script, you would only know about it after you executed the
things before, which oftentimes was too late.

A third approach also existed. The
`Truffle <https://www.trufflesuite.com/docs/truffle/getting-started/running-migrations>`_
framework had a concept called "migrations". They are deployment scripts which
are executed only once to bring the network to a desired state. Each network
required a Migrations smart contract which kept track of which scripts have been
executed. In this way if you added more scripts only the new ones would get run.

Migrations shared their downsides with deployment scripts, while also introducing
the additional cost of deploying another smart contract, which could cost hundreds
of dollars on the main Ethereum network.

Infrastructure as code
----------------------

In recent years the complexity of web development rose greatly creating many new
scaling challenges. To overcome them a new approach arose. It became known as
infrastructure as code. Programmers would specify how the system should be
deployed and automation software would bring all the services to the required
state.

Today we face a similar situation in Ethereum space. Smart contracts that we
write have grown bigger and more complex, requiring precise setup to work. And
yet the tools we use resemble one-off scripts much more than the elegant
configurations used in infrastructure as code.

At Mars we believe that changing the approach to managing smart contract systems
will greatly benefit the ecosystem and simplify development.

The solution
------------

Mars introduces a novel way to write deployment configurations. Programmers
simply state what contracts should exist and what parameters should they take.
Additionally precise calls can be made that bring the system to a desired state.

Let's look at a simple example:

.. code-block:: typescript

   import { deploy, contract } from 'ethereum-mars'
   import { MyCoin } from './build/artifacts'

   deploy(() => {
     contract(MyCoin)
   })

When run for the first time this script will deploy the MyCoin contract to the
network. A new file :code:`deployments.json` will be created.

.. code-block:: json

   {
     "mainnet": {
       "myCoin": {
         "address": "0xad706a792fa8a5630a435afff281d04bb59be245",
         "txHash": "0xe0c53afd7339f8f26ccd13b7f7b208c2190e2cc8d0fec59c4dd117c4aaa69a6e"
       }
     }
   }

When you run the script for the second time the deployment will be skipped,
because the code didn't change. If however you modified the source of MyCoin, it
will be redeployed.

.. note::

   Mars is clever about the way it detects changes. Solidity contracts include
   a hash of the source in the bytecode. This means that if you added a comment
   or changed formatting of your :code:`.sol` files the bytecode will be
   different! Mars however knows about this and won't trigger a redeploy.

Now, let's move on to something a little more complex.

.. code-block:: typescript

   import { deploy, contract } from 'ethereum-mars'
   import { Token, Market } from './build/artifacts'

   deploy(() => {
     const plumToken = contract('plum', Token, ['Plum', 'PLM'])
     const tomatoToken = contract('tomato', Token, ['Tomato', 'TMT'])
     contract(Market, [plumToken, tomatoToken])
   })

Running this will deploy two Token contracts. One with the parameters
:code:`'Plum'` and :code:`'PLM'` and the other with :code:`'Tomato'` and
:code:`'TMT'`. It will also deploy the Market contract with the addresses of
the two contracts passed as parameters.

All of this will result in a :code:`deployments.json` looking like this:

.. code-block:: json

   {
     "mainnet": {
       "plum": {
         "address": "0x8aadc17779f256baeaef7572214c6c4d7c9abd0c",
         "txHash": "0xcc027a4e193c335388248d63755b166f50ef66cb32172b2d5067df5ed8b5eb35"
       },
       "tomato": {
         "address": "0x4cc7d6bb9048ada0eaf51afdadf92a63564c3bbc",
         "txHash": "0xbf4a09bc27d372ea47da13c3876a721384bdf0575e328bbc3ed6890ac7dbc42e"
       },
       "market": {
         "address": "0x0a511abfdcf8a721c141c0855d7e2bc20905c825",
         "txHash": "0x96feafc71caaaf3bf9863fd1606998da13d71005ef1498e220ac42ceb0b098a9"
       }
     }
   }


.. note::

   The names in the output depend on what you pass to the :code:`contract`
   function. For the Market contract the name was automatically set as
   "market". But the two tokens have their names explicitly specified.

Suppose you actually wanted a different symbol for the Tomato token. We'll
change it in the deployment script.

.. code-block:: typescript

   import { deploy, contract } from 'ethereum-mars'
   import { Token, Market } from './build/artifacts'

   deploy(() => {
     const plumToken = contract('plum', Token, ['Plum', 'PLM'])
     // the change happens here TMT -> TOM
     const tomatoToken = contract('tomato', Token, ['Tomato', 'TOM'])
     contract(Market, [plumToken, tomatoToken])
   })

If we run the script now Mars will figure out that it needs to redeploy the
tomato token. But because of this the parameters of the Market will also change,
so it will also be redeployed. Here lies the greatest strength of Mars. It
is able to figure out what needs to be done to get you where you want to be.

With this you should be well equipped to start playing around with Mars. Read
:doc:`getting-started` next. Happy exploring!
