Verifying smart contracts
=========================

Currently, you can automate contract verification on Etherscan
if you are using Waffle to build your contracts.

In order to verify your contracts, use your deployment script
with the following command line parameters:

.. code-block:: bash

   yarn ts-node deployment.ts --verify --etherscan-key <ETHERSCAN_API_KEY>

In order for this to work, the :code:`compilerOptions` in your
:code:`waffle.json` config file must be stated explicitly, as
Waffle's default compiler options are different from Etherscan's.

The :code:`compilerVersion` setting also needs to be set to
one of the `compiler versions supported by Etherscan <https://etherscan.io/solcversions>`_.
