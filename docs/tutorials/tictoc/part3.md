# Part 3 - Enhancing the 2-node TicToc

## 3.1 Adding icons

Here we make the model look a bit prettier in the GUI. We assign
the `block/routing` icon (the file `images/block/routing.png`), and paint it cyan for `tic`
and yellow for `toc`. This is achieved by adding display strings to the
NED file. The `i=` tag in the display string specifies the icon.

<pre class="snippet" src="../code/tictoc2.ned" from="simple Txc2" upto="toc.out;\n}"></pre>

You can see the result here:

<img src="images/step2a.png">


## 3.2 Adding logging

We also modify the C++ code. We add log statements to `Txc1` so that it
prints what it is doing. OMNeT++ provides a sophisticated logging facility
with log levels, log channels, filtering, etc. that are useful for large
and complex models, but in this model we'll use its simplest form `EV`:

<pre class="snippet" src="../code/txc2.cc" from="EV" until="cMessage"></pre>

and

<pre class="snippet" src="../code/txc2.cc" after="here it will be" upto="EV"></pre>

When you run the simulation in the OMNeT++ runtime environment, the following output
will appear in the log window:

<img src="images/step2b.png">

You can also open separate output windows for *tic* and *toc* by right-clicking
on their icons and choosing *Component log* from the menu. This feature
will be useful when you have a large model ("fast scrolling logs syndrome")
and you're interested only in the log messages of specific module.

<img src="images/step2c.png">

Sources: <a srcfile="tutorials/tictoc/code/tictoc2.ned"></a>, <a srcfile="tutorials/tictoc/code/txc2.cc"></a>, <a srcfile="tutorials/tictoc/code/omnetpp.ini"></a>


## 3.3 Adding state variables

In this step we add a counter to the module, and delete the message
after ten exchanges.

We add the counter as a class member:

<pre class="snippet" src="../code/txc3.cc" from="class Txc3" upto="protected"></pre>

We set the variable to 10 in `initialize()` and decrement in `handleMessage()`,
that is, on every message arrival. After it reaches zero, the simulation
will run out of events and terminate.

Note the

<pre class="snippet" src="../code/txc3.cc" after="in the list." upto="WATCH"></pre>

line in the source: this makes it possible to see the counter value
in the graphical runtime environment.

If you click on `tic`'s icon, the inspector window in the bottom left corner of the main window will display
details about `tic`. Make sure that *Children* mode is selected from the toolbar at the top.
The inspector now displays the counter variable.

<img src="images/inspector.png">

As you continue running the simulation, you can follow as the counter
keeps decrementing until it reaches zero.

Sources: <a srcfile="tutorials/tictoc/code/tictoc3.ned"></a>, <a srcfile="tutorials/tictoc/code/txc3.cc"></a>, <a srcfile="tutorials/tictoc/code/omnetpp.ini"></a>


## 3.4 Adding parameters

In this step you'll learn how to add input parameters to the simulation:
we'll turn the "magic number" 10 into a parameter and add a boolean parameter
to decide whether the module should send out the first message in its
initialization code (whether this is a `tic` or a `toc` module).

Module parameters have to be declared in the NED file. The data type can
be numeric, string, bool, or xml (the latter is for easy access to
XML config files), among others.

<pre class="snippet" src="../code/tictoc4.ned" from="simple Txc4" upto="gates"></pre>

We also have to modify the C++ code to read the parameter in
`initialize()`, and assign it to the counter.

<pre class="snippet" src="../code/txc4.cc" after="in the NED file" upto="counter"></pre>

We can use the second parameter to decide whether to send initial message:

<pre class="snippet" src="../code/txc4.cc" after="whether to send" upto="par\("></pre>

Now, we can assign the parameters in the NED file or from `omnetpp.ini`.
Assignments in the NED file take precedence. You can define default
values for parameters if you use the `default(...)` syntax
in the NED file. In this case you can either set the value of the
parameter in omnetpp.ini or use the default value provided by the NED file.

Here, we assign one parameter in the NED file:

<pre class="snippet" src="../code/tictoc4.ned" from="network Tictoc4" upto="connections"></pre>

and the other in `omnetpp.ini`:

<pre class="snippet" src="../code/omnetpp.ini" after="network = Tictoc4" upto="Tictoc4.toc"></pre>

Note that because omnetpp.ini supports wildcards, and parameters
assigned from NED files take precedence over the ones in omnetpp.ini,
we could have used

```
Tictoc4.t*c.limit=5
```

or

```
Tictoc4.*.limit=5
```

or even

```
**.limit=5
```

with the same effect. (The difference between `*` and `**` is that `*` will not match
a dot and `**` will.)

In the graphical runtime environment, you can inspect module parameters either in the object tree
on the left-hand side of the main window, or in the Parameters page of
the module inspector (information is shown in the bottom left corner of the main window after
clicking on a module).

The module with the smaller limit will delete the message and thereby
conclude the simulation.

Sources: <a srcfile="tutorials/tictoc/code/tictoc4.ned"></a>, <a srcfile="tutorials/tictoc/code/txc4.cc"></a>, <a srcfile="tutorials/tictoc/code/omnetpp.ini"></a>


## 3.5 Using NED inheritance

If we take a closer look at the NED file we will realize that `tic`
and `toc` differs only in their parameter values and their display string.
We can create a new simple module type by inheriting from an other one and specifying
or overriding some of its parameters. In our case we will derive two simple
module types (`Tic` and `Toc`). Later we can use these types when defining
the submodules in the network.

Deriving from an existing simple module is easy. Here is the base module:

<pre class="snippet" src="../code/tictoc5.ned" from="simple Txc5" upto="}"></pre>

And here is the derived module. We just simply specify the parameter values and add some
display properties.

<pre class="snippet" src="../code/tictoc5.ned" from="simple Tic5" upto="}"></pre>

The `Toc` module looks similar, but with different parameter values.

<pre class="snippet" src="../code/tictoc5.ned" from="simple Toc5" upto="}"></pre>

!!! note
    The C++ implementation is inherited from the base simple module (`Txc5`).

Once we created the new simple modules, we can use them as submodule types in our network:

<pre class="snippet" src="../code/tictoc5.ned" from="network" upto="connections"></pre>

As you can see, the network definition is much shorter and simpler now.
Inheritance allows you to use common types in your network and avoid
redundant definitions and parameter settings.


## 3.6 Modeling processing delay

In the previous models, `tic` and `toc` immediately sent back the
received message. Here we'll add some timing: `tic` and `toc` will hold the
message for 1 simulated second before sending it back. In OMNeT++
such timing is achieved by the module sending a message to itself.
Such messages are called self-messages (but only because of the way they
are used, otherwise they are ordinary message objects).

We added two cMessage * variables, `event` and `tictocMsg`
to the class, to remember the message we use for timing and message whose
processing delay we are simulating.

<pre class="snippet" src="../code/txc6.cc" from="class Txc6" upto="public"></pre>

We "send" the self-messages with the scheduleAt() function, specifying
when it should be delivered back to the module.

<pre class="snippet" src="../code/txc6.cc" after="tictocMsg = msg;" upto="scheduleAt\("></pre>

In `handleMessage()` now we have to differentiate whether a new message
has arrived via the input gate or the self-message came back
(timer expired). Here we are using

<pre class="snippet" src="../code/txc6.cc" after="method" upto="if \(msg == event\) \{"></pre>

but we could have written

```
    if (msg->isSelfMessage())
```

as well.

We have left out the counter, to keep the source code small.

While running the simulation you will see the following log output:

<img src="images/step6.png">

Sources: <a srcfile="tutorials/tictoc/code/tictoc6.ned"></a>, <a srcfile="tutorials/tictoc/code/txc6.cc"></a>, <a srcfile="tutorials/tictoc/code/omnetpp.ini"></a>


## 3.7 Random numbers and parameters

In this step we'll introduce random numbers. We change the delay from 1s
to a random value which can be set from the NED file or from omnetpp.ini.
Module parameters are able to return random variables; however, to make
use of this feature we have to read the parameter in `handleMessage()`
every time we use it.

<pre class="snippet" src="../code/txc7.cc" from="module parameter" until="scheduleAt\("></pre>

In addition, we'll "lose" (delete) the packet with a small (hardcoded) probability.

<pre class="snippet" src="../code/txc7.cc" from="uniform\(" upto="}"></pre>

We'll assign the parameters in omnetpp.ini:

<pre class="snippet" src="../code/omnetpp.ini" from="Tictoc7.t" upto="Tictoc7.t"></pre>

You can try that no matter how many times you re-run the simulation (or
restart it, *Simulate -> Rebuild network* menu item), you'll get exactly the
same results. This is because OMNeT++ uses a deterministic algorithm
(by default the Mersenne Twister RNG) to generate random numbers, and
initializes it to the same seed. This is important for reproducible
simulations. You can experiment with different seeds if you add the
following lines to omnetpp.ini:

```
[General]
seed-0-mt=532569  # or any other 32-bit value
```

From the syntax you have probably guessed that OMNeT++ supports
more than one RNGs. That's right, however, all models in this tutorial
use RNG 0.

!!! tip "Exercise"
    Try other distributions as well.

Sources: <a srcfile="tutorials/tictoc/code/tictoc7.ned"></a>, <a srcfile="tutorials/tictoc/code/txc7.cc"></a>, <a srcfile="tutorials/tictoc/code/omnetpp.ini"></a>


## 3.8 Timeout, cancelling timers

In order to get one step closer to modelling networking protocols,
let us transform our model into a stop-and-wait simulation.
This time we'll have separate classes for `tic` and `toc`. The basic
scenario is similar to the previous ones: `tic` and `toc` will be tossing a
message to one another. However, `toc` will "lose" the message with some
nonzero probability, and in that case `tic` will have to resend it.

Here's `toc`'s code:

<pre class="snippet" src="../code/txc8.cc" from="void Toc8" upto="else"></pre>

Thanks to the `bubble()` call in the code, `toc` will display a callout whenever
it drops the message.

<img src="images/step8.png">

So, `tic` will start a timer whenever it sends the message. When
the timer expires, we'll assume the message was lost and send another
one. If `toc`'s reply arrives, the timer has to be cancelled.
The timer will be (what else?) a self-message.

<pre class="snippet" src="../code/txc8.cc" after="send\(newMsg" upto="scheduleAt\("></pre>

Cancelling the timer will be done with the `cancelEvent()` call. Note that
this does not prevent us from being able to reuse the same
timeout message over and over.

<pre class="snippet" src="../code/txc8.cc" after="Timer cancelled." upto="cancelEvent\("></pre>

You can read Tic's full source in <a srcfile="tutorials/tictoc/code/txc8.cc"></a>

Sources: <a srcfile="tutorials/tictoc/code/tictoc8.ned"></a>, <a srcfile="tutorials/tictoc/code/txc8.cc"></a>, <a srcfile="tutorials/tictoc/code/omnetpp.ini"></a>


## 3.9 Retransmitting the same message

In this step we refine the previous model.
There we just created another packet if we needed to
retransmit. This is OK because the packet didn't contain much, but
in real life it's usually more practical to keep a copy of the original
packet so that we can re-send it without the need to build it again.
Keeping a pointer to the sent message - so we can send it again - might seem easier,
but when the message is destroyed at the other node the pointer becomes invalid.

What we do here is keep the original packet and send only copies of it.
We delete the original when `toc`'s acknowledgement arrives.
To make it easier to visually verify the model, we'll include a message
sequence number in the message names.

In order to avoid `handleMessage()` growing too large, we'll put the
corresponding code into two new functions, `generateNewMessage()`
and `sendCopyOf()` and call them from `handleMessage()`.

The functions:

<pre class="snippet" src="../code/txc9.cc" from="cMessage \*Tic9" upto="return msg;\n}"></pre>

<pre class="snippet" src="../code/txc9.cc" from="void Tic9::sendCopyOf" upto="\)\;\n\}"></pre>

Sources: <a srcfile="tutorials/tictoc/code/tictoc9.ned"></a>, <a srcfile="tutorials/tictoc/code/txc9.cc"></a>, <a srcfile="tutorials/tictoc/code/omnetpp.ini"></a>

[cMessage]: https://omnetpp.org/doc/omnetpp/api/classomnetpp_1_1cMessage.html

