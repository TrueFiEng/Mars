Welcome!
========

.. warning::
   Mars is in its infancy. While it already can do many useful things it may still
   contain some bugs. Please use it with caution and report or fix anything suspicious.

What is Mars?
-------------

Mars is an infrastructure-as-code tool for Ethereum. It allows you to write and
execute deployment configurations for your smart contract project.

To learn more about the motivation behind Mars visit the :doc:`introduction`.

Show me an example!
-------------------

There you go:

.. code-block:: typescript

   import { deploy, contract } from 'ethereum-mars'
   import { Token, Market } from '../build/artifacts'

   deploy(() => {
     const fooToken = contract('foo', Token)
     const barToken = contract('bar', Token)
     contract(Market, [fooToken, barToken])
   })

When executed the script produces a CLI that collects parameters like the network,
gas price and private keys. You can then execute the deployment in a safe, dry-run
environment or deploy to the network directly. If you already deployed some of the
contracts and their code didn't change then Mars won't redeploy them.

To learn more about how to use Mars visit :doc:`getting-started` or jump straight
into the :doc:`cli`.

I want to contribute
--------------------

That is excellent. There is always a lot of things that you can improve and help
develop. You can view the projects code at
`our github repository <https://github.com/EthWorks/Mars>`_ or browse through
`the issues <https://github.com/EthWorks/Mars/issues>`_.

.. toctree::
   :maxdepth: 3
   :caption: Contents:

   introduction.rst
   getting-started.rst
   cli.rst
   syntax.rst
   futures.rst
   configuration.rst
