Getting started
===============

.. note::
   Hey! Thanks for trying out Mars. We are still working on this section, so
   expect more content here in the future.

   While we build the documentation you are welcome to check out the code at
   `our github repository <https://github.com/EthWorks/Mars>`_. Maybe you fancy
   contributing?

To install mars use Yarn:

.. code-block::

   yarn add --dev ethereum-mars

or if you prefer you can use npm:

.. code-block::

   npm install --save-dev ethereum-mars

In order to generate an artifacts file that Mars will use when deploying, run:

.. code-block::

   yarn mars

It is advisable to add the above command at the end your build script so it
gets executed every time you build a new version of your contracts.
