CLI Reference
*******************

.. note::
   Hey! Thanks for trying out Mars. We are still working on this section, so
   expect more content here in the future.

   While we build the documentation you are welcome to check out the code at
   `our github repository <https://github.com/EthWorks/Mars>`_. Maybe you fancy
   contributing?

.. _artifacts:

Artifact Generation
=====================

Before using Mars, first you have to generate contract artifacts.
Artifacts are used to enable typechecks in deployment scripts.

Before all, you need to compile contracts (here's how it's done with `Waffle <https://ethereum-waffle.readthedocs.io/en/latest/compilation.html>`_, `Truffle <https://www.trufflesuite.com/docs/truffle/getting-started/compiling-contracts>`_, `Hardhat <https://hardhat.org/guides/compile-contracts.html>`_)
This will generate JSON files with contract ABIs. Usually they can be found under ``./build`` directory.

Now you are ready to generate artifacts by running

.. code-block:: bash

   yarn mars [--input, -i ./build] [--output, -o './build/artifacts.ts']

CLI flags
^^^^^^^^^

+----------+----------------+------+----------+----------------------+------------------------------+
| Flag     | Shorthand flag | Type | Required | Default value        | Description                  |
+==========+================+======+==========+======================+==============================+
| --input  | -i             | Path | No       | ./build              | Directory with contract ABIs |
+----------+----------------+------+----------+----------------------+------------------------------+
| --output | -o             | Path | No       | ./build/artifacts.ts | Path to generated file       |
+----------+----------------+------+----------+----------------------+------------------------------+
| --help   | -h             | Bool | No       | False                | Show help                    |
+----------+----------------+------+----------+----------------------+------------------------------+

Contract Deployment
===================

After artifacts are generated, you are now ready to deploy contracts.
Deployment scripts are basically Javascript or Typescript files and are simply started as
``node deploy.js`` or ``ts-node deploy.ts``. Learn how to write script by visitting :doc:`syntax`

CLI flags
^^^^^^^^^
+-----------------+-------+------+----------------+--------------------+-----------------------------------------------------------------+
| Flag            | Short | Type | Required       | Default value      | Description                                                     |
+=================+=======+======+================+====================+=================================================================+
| --private-key   | -p    | Str  | Yes            |                    | Deployer private key in ``0x...`` format                        |
+-----------------+-------+------+----------------+--------------------+-----------------------------------------------------------------+
| --infura-key    | -i    | Str  | Either one     |                    | API key for Infura                                              |
|                 |       |      |                |                    |                                                                 |
+-----------------+-------+------+ Can be skipped +--------------------+-----------------------------------------------------------------+
| --alchemy-key   | -a    | Str  | for custom RPC |                    | API key for Alchemy (is prioritised)                            |
+-----------------+-------+------+----------------+--------------------+-----------------------------------------------------------------+
| --network       | -n    | Str  | No             | mainnet            | Network name. Should be one of:                                 |
|                 |       |      |                |                    |                                                                 |
|                 |       |      |                |                    | mainnet, development, kovan, ropsten, goerli, rinkeby,          |
|                 |       |      |                |                    | arbitrum, arbitrum_rinkeby,                                     |
|                 |       |      |                |                    | optimism, optimism_kovan                                        |
|                 |       |      |                |                    |                                                                 |
|                 |       |      |                |                    | or RPC URL e.g. ``https://infura.io/...``                       |
+-----------------+-------+------+----------------+--------------------+-----------------------------------------------------------------+
| --out-file      | -o    | Path | No             | ./deployments.json | Path to the JSON file with deployed contract addresses          |
+-----------------+-------+------+----------------+--------------------+-----------------------------------------------------------------+
| --gas-price     | -g    | Int  | No             |                    | Gas price in gwei                                               |
+-----------------+-------+------+----------------+--------------------+-----------------------------------------------------------------+
| --dry-run       | -d    | Bool | No             | false              | Simulate deployment locally. :ref:`Learn more <Dry run>`        |
+-----------------+-------+------+----------------+--------------------+-----------------------------------------------------------------+
| --yes           | -y    | Bool | No             | false              | Run deploys without confirmation                                |
+-----------------+-------+------+----------------+--------------------+-----------------------------------------------------------------+
| --verify        | -v    | Bool | No             | false              | Verify contracts. :ref:`Learn more <Verifying smart contracts>` |
+-----------------+-------+------+----------------+--------------------+-----------------------------------------------------------------+
| --sources       | -s    | Path | No             | ./contracts        | Contract source. Used only by Etherscan verification            |
+-----------------+-------+------+----------------+--------------------+-----------------------------------------------------------------+
| --waffle-config | -w    | Path | No             | ./waffle.json      | Path to waffle.json file. Used only by Etherscan verification   |
+-----------------+-------+------+----------------+--------------------+-----------------------------------------------------------------+
| --etherscan-key | -e    | Str  | Yes            |                    | API key for Etherscan.io. Required for verification             |
|                 |       |      | (if verifying) |                    |                                                                 |
+-----------------+-------+------+----------------+--------------------+-----------------------------------------------------------------+

.. note::
   Some flags can be replaced by environment variables:

   * ``PRIVATE_KEY`` instead of ``--private-key``
   * ``INFURA_KEY`` instead of ``--infura-key``
   * ``ALCHEMY_KEY`` instead of ``--alchemy-key``
   * ``ETHERSCAN_KEY`` instead of ``--etherscan-key``

   Note that CLI flags have priority over environment variables.


Dry run
^^^^^^^^^

Mars supports a feature called "Dry run" i.e. simulation of deployment execution locally.
To perform a dry-run, run Mars deploy script with ``-d`` flag

.. code-block:: bash

   yarn ts-node deployment.ts -d -n <NETWORK_NAME>

When Mars does a dry-run, it creates a carbon copy of the blockchain state on a local
Ganache node and sends all the same transactions that are to be executed with a normal run.
This is a great tool to make sure the deployment is correct and we strongly recommend doing it before deploys to mainnet.


Verifying smart contracts
^^^^^^^^^^^^^^^^^^^^^^^^^^^

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

Another option to verify contracts is to provide script that will return flattened contract code based on file name.
See `flattener.ts` as an example.

.. code-block:: bash

   yarn ts-node deployment.ts --verify src/flattener.ts --etherscan-key <ETHERSCAN_API_KEY>


