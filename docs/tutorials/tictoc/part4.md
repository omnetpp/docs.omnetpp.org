# Part 4 - Turning it Into a Real Network

## 4.1 More than two nodes

Now we'll make a big step: create several `tic` modules and connect
them into a network. For now, we'll keep it simple what they do:
one of the nodes generates a message, and the others keep tossing
it around in random directions until it arrives at
a predetermined destination node.

The NED file will need a few changes. First of all, the `Txc` module will
need to have multiple input and output gates:

<pre class="snippet" src="../code/tictoc10.ned" from="simple Txc10" upto="output out\[\];\n}"></pre>

The `[ ]` turns the gates into gate vectors. The size of the vector
(the number of gates) will be determined where we use Txc to build
the network.

<pre class="snippet" src="../code/tictoc10.ned" from="network Tictoc10" upto="tic\[5\].out\+\+;\n}"></pre>

Here we created 6 modules as a module vector, and connected them.

The resulting topology looks like this:

<img src="images/step10.png">

In this version, `tic[0]` will generate the message to be sent around.
This is done in `initialize()`, with the help of the `getIndex()` function which
returns the index of the module in the vector.

The meat of the code is the `forwardMessage()` function which we invoke
from `handleMessage()` whenever a message arrives at the node. It draws
a random gate number, and sends out message on that gate.

<pre class="snippet" src="../code/txc10.cc" from="void Txc10::forwardMessage" upto="k\);\n}"></pre>

When the message arrives at `tic[3]`, its `handleMessage()` will delete the message.

See the full code in <a srcfile="tutorials/tictoc/code/txc10.cc"></a>

!!! tip "Exercise"
    You'll notice that this simple "routing" is not very efficient:
    often the packet keeps bouncing between two nodes for a while before it is sent
    to a different direction. This can be improved somewhat if nodes don't send
    the packet back to the sender. Implement this. Hints: `cMessage::getArrivalGate()`,
    `cGate::getIndex()`. Note that if the message didn't arrive via a gate but was
    a self-message, then `getArrivalGate()` returns `NULL`.

Sources: <a srcfile="tutorials/tictoc/code/tictoc10.ned"></a>, <a srcfile="tutorials/tictoc/code/txc10.cc"></a>, <a srcfile="tutorials/tictoc/code/omnetpp.ini"></a>


## 4.2 Channels and inner type definitions

Our new network definition is getting quite complex and long, especially
the connections section. Let's try to simplify it. The first thing we
notice is that the connections always use the same `delay` parameter.
It is possible to create types for the connections (they are called channels)
similarly to simple modules. We should create a channel type which specifies the
delay parameter and we will use that type for all connections in the network.

<pre class="snippet" src="../code/tictoc11.ned" from="network Tictoc11" upto="submodules"></pre>

As you have noticed we have defined the new channel type inside the network definition
by adding a `types` section. This type definition is only visible inside the
network. It is called as a local or inner type. You can use simple modules as inner types
too, if you wish.

!!! note
    We have created the channel by specializing the built-in `DelayChannel`.
    (built-in channels can be found inside the `ned` package. Thats why we used
    the full type name `ned.DelayChannel`) after the `extends` keyword.

Now let's check how the `connections` section changed.

<pre class="snippet" src="../code/tictoc11.ned" from="connections:" upto="tic\[5\].out\+\+;\n}"></pre>

As you see we just specify the channel name inside the connection definition.
This allows to easily change the delay parameter for the whole network.

Sources: <a srcfile="tutorials/tictoc/code/tictoc11.ned"></a>, <a srcfile="tutorials/tictoc/code/txc11.cc"></a>, <a srcfile="tutorials/tictoc/code/omnetpp.ini"></a>


## 4.3 Using two-way connections

If we check the `connections` section a little more, we will realize that
each node pair is connected with two connections. One for each direction.
OMNeT++ 4 supports two way connections, so let's use them.

First of all, we have to define two-way (or so called `inout`) gates instead of the
separate `input` and `output` gates we used previously.

<pre class="snippet" src="../code/tictoc12.ned" from="simple Txc12" upto="declare two way connections\n}"></pre>

The new `connections` section would look like this:

<pre class="snippet" src="../code/tictoc12.ned" from="connections:" upto="tic\[5\].gate\+\+;\n}"></pre>

We have modified the gate names so we have to make some modifications to the
C++ code.

<pre class="snippet" src="../code/txc12.cc" from="void Txc12::forwardMessage" upto="k\);\n}"></pre>

!!! note
    The special $i and $o suffix after the gate name allows us to use the
    connection's two direction separately.

Sources: <a srcfile="tutorials/tictoc/code/tictoc12.ned"></a>, <a srcfile="tutorials/tictoc/code/txc12.cc"></a>, <a srcfile="tutorials/tictoc/code/omnetpp.ini"></a>


## 4.4 Defining our message class

In this step the destination address is no longer hardcoded `tic[3]` -- we draw a
random destination, and we'll add the destination address to the message.

The best way is to subclass cMessage and add destination as a data member.
Hand-coding the message class is usually tedious because it contains
a lot of boilerplate code, so we let OMNeT++ generate the class for us.
The message class specification is in `tictoc13.msg`:

<pre class="snippet" src="../code/tictoc13.msg" from="message TicTocMsg13" upto="}"></pre>

!!! note
    See <a href="../manual/index.html#cha:msg-def" target="_blank">Section 6</a> of the OMNeT++ manual for more details on messages.

The makefile is set up so that the message compiler, opp_msgc is invoked
and it generates `tictoc13_m.h` and `tictoc13_m.cc` from the message declaration
(The file names are generated from the `tictoc13.msg` file name, not the message type name).
They will contain a generated `TicTocMsg13` class subclassed from [`cMessage`];
the class will have getter and setter methods for every field.

We'll include `tictoc13_m.h` into our C++ code, and we can use `TicTocMsg13` as
any other class.

<pre class="snippet" src="../code/txc13.cc" after="cMessage" upto="tictoc13_m.h"></pre>

For example, we use the following lines in `generateMessage()` to create the
message and fill its fields.

<pre class="snippet" src="../code/txc13.cc" from="TicTocMsg13 \*msg = new TicTocMsg13\(msgname\);" upto="return msg;"></pre>

Then, `handleMessage()` begins like this:

<pre class="snippet" src="../code/txc13.cc" from="void Txc13::handleMessage\(" upto="getDestination"></pre>

In the argument to handleMessage(), we get the message as a `cMessage*` pointer.
However, we can only access its fields defined in `TicTocMsg13` if we cast
msg to `TicTocMsg13*`. Plain C-style cast (`(TicTocMsg13 *)msg`)
is not safe because if the message is *not* a `TicTocMsg13` after all
the program will just crash, causing an error which is difficult to explore.

C++ offers a solution which is called `dynamic_cast`. Here we use `check_and_cast<>()`
which is provided by OMNeT++: it tries to cast the pointer via `dynamic_cast`,
and if it fails it stops the simulation with an error message, similar to the
following:

<img src="images/step13e.png">

In the next line, we check if the destination address is the same as the
node's address. The `getIndex()` member function returns the index
of the module in the submodule vector (remember, in the NED file we
declarared it as `tic: Txc13[6]`, so our nodes have addresses 0..5).

To make the model execute longer, after a message arrives to its destination
the destination node will generate another message with a random destination
address, and so forth. Read the full code: <a srcfile="tutorials/tictoc/code/txc13.cc"></a>

When you run the model, it'll look like this:

<img src="images/step13a.png">

You can click on the messages to see their content in the inspector window.
Double-clicking will open the inspector in a new window.
(You'll either have to temporarily stop the simulation for that,
or to be very fast in handling the mouse). The inspector window
displays lots of useful information; the message fields can be seen
on the *Contents* page.

<img src="images/step13b.png">

Sources: <a srcfile="tutorials/tictoc/code/tictoc13.ned"></a>, <a srcfile="tutorials/tictoc/code/tictoc13.msg"></a>, <a srcfile="tutorials/tictoc/code/txc13.cc"></a>, <a srcfile="tutorials/tictoc/code/omnetpp.ini"></a>

!!! tip "Exercise"
    In this model, there is only one message underway at any
    given moment: nodes only generate a message when another message arrives
    at them. We did it this way to make it easier to follow the simulation.
    Change the module class so that instead, it generates messages periodically.
    The interval between messages should be a module parameter, returning
    exponentially distributed random numbers.

[cMessage]: https://omnetpp.org/doc/omnetpp/api/classomnetpp_1_1cMessage.html

