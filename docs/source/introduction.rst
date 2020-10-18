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

Lorem ipsum, dolor sit amet consectetur adipisicing elit. Est consequatur vel ut! Cupiditate excepturi voluptates, maiores tempora velit iusto vero quas architecto minus hic, exercitationem, quae nesciunt earum repellat harum! Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero corrupti, animi aut magnam pariatur incidunt tenetur at delectus impedit? Esse odio cupiditate reprehenderit mollitia blanditiis vero magnam asperiores perferendis dolores?

Challenges
----------

Lorem ipsum dolor sit amet, consectetur adipisicing elit. Veniam quibusdam, eum quae expedita velit dolore at labore hic optio excepturi aperiam omnis. Cupiditate, nostrum laboriosam rem eum velit doloremque quia!

Lorem ipsum dolor sit amet consectetur adipisicing elit. Sapiente possimus expedita in voluptate ratione. Sequi commodi voluptatibus quasi omnis, iste quam dolor ut consequuntur corporis! Numquam est totam distinctio nobis!

The solution
------------

Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quaerat placeat sint fuga tenetur voluptatum laborum eligendi saepe tempora illo quod repudiandae non aut, similique iure ex sed recusandae voluptates quis! Lorem ipsum dolor sit amet consectetur adipisicing elit. Id optio ad voluptates tempore in dicta possimus illum totam unde debitis? Doloribus fuga, fugiat aspernatur libero hic maxime illo consectetur numquam? Lorem, ipsum dolor sit amet consectetur adipisicing elit. Minima earum minus id, distinctio consequatur accusamus consectetur quod aut neque perferendis quam reiciendis eum suscipit asperiores totam voluptatibus recusandae laudantium facere!
