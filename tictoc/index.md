---
layout: page
tutorial: TicToc
title: TicToc Tutorial
---

This tutorial to guides you through building and working
with an example simulation model, showing you along the way some
of the commonly used OMNeT++ features.

The tutorial is based on the Tictoc example simulation, which you
can find in the `samples/tictoc` directory of your
OMNeT++ installation, so you can try out immediately how
the examples work. However, you'll find the tutorial much more useful
if you actually carry out the steps described here.
We assume that you have a good C++ knowledge, and you are in general
familiar with C/C++ development (editing source files, compiling, debugging etc.)
To make the examples easier to follow, all source code in here is
cross-linked to the OMNeT++ API documentation.

This document and the TicToc model are an expanded version of
the original TicToc tutorial from Ahmet Sekercioglu (Monash University).

### Contents

TODO

--------------------------------------------------------------------------

## Part 1 - Getting started

### 1.1 The model

For a start, let us begin with a "network" that consists of two nodes.
The nodes will do something simple: one of the nodes will create a packet,
and the two nodes will keep passing the same packet back and forth.
We'll call the nodes `tic` and `toc`. Later we'll gradually
improve this model, introducing OMNeT++ features at each step.

Here are the steps you take to implement your first simulation from scratch.


### 1.2 Setting up the project

Start the OMNeT++ IDE by typing `omnetpp` in your terminal. (We assume
that you already have a working OMNeT++ installation. If not, please install the latest
version, consulting the *Installation Guide* as needed.)
Once in the IDE, choose *New -> OMNeT++ Project* from the menu.

<img src="images/newproject.png">

A wizard dialog will appear. Enter `tictoc` as project name,
choose *Empty project* when asked about the initial content of the project,
then click *Finish*. An empty project will be created, as you can see
in the *Project Explorer*.
(Note: Some OMNeT++ versions will generate a `package.ned` file into the project.
We don't need it now: delete the file by selecting it and hitting Delete.)

The project will hold all files that belong to our simulation. In our example,
the project consists of a single directory. For larger simulations, the project's
contents are usually sorted into `src/` and `simulations/` folders,
and possibly subfolders underneath them.

**NOTE:** Using the IDE is entirely optional. Almost all functionality of OMNeT++
(except for some very graphics-intensive and interactive features
like sequence chart browsing and result plotting) is available on
the command line. Model source files can be edited with any text editor,
and OMNeT++ provides command-line tools for special tasks such as makefile
creation, message file to C++ translation, result file querying and data export,
and so on. To proceed without the IDE, simply create a directory and create the
following NED, C++ and ini files in it with your favorite text editor.
{:.well}


### 1.3 Adding the NED file

OMNeT++ uses NED files to define components and to assemble them into larger units
like networks. We start implementing our model by adding a NED file.
To add the file to the project, right-click the project directory in the
*Project Explorer* panel on the left, and choose *New -> Network Description File (NED)*
from the menu. Enter `tictoc1.ned` when prompted for the file name.

Once created, the file can be edited in the *Editor area* of the OMNeT++ IDE.
The OMNeT++ IDE's NED editor has two modes, *Design* and *Source*; one can switch
between them using the tabs at the bottom of the editor. In *Design* mode,
the topology can be edited graphically, using the mouse and the palette on the right.
In *Source* mode, the NED source code can be directly edited as text.
Changes done in one mode will be immediately reflected in the other, so you can
freely switch between modes during editing, and do each change in whichever mode
it is more convenient. (Since NED files are plain text files, you can even use
an external text editor to edit them, although you'll miss syntax highlighting,
content assist, cross-references and other IDE features.)

Switch into *Source* mode, and enter the following:

@dontinclude tictoc1.ned
@skip simple Txc1
@until toc.out
@skipline }

When you're done, switch back to *Design* mode. You should see something like this:

<img src="images/nededitor.png">

The first block in the file declares `Txc1` as a simple module type.
Simple modules are atomic on NED level. They are also active components,
and their behavior is implemented in C++. The declaration also says that
`Txc1` has an input gate named `in`, and an output gate named `out`.

The second block declares `Tictoc1` as a network. `Tictoc1` is assembled from two
submodules, `tic` and `toc`, both instances of the module type `Txc1`.
`tic`'s output gate is connected to `toc`'s input gate, and vica versa.
There will be a 100ms propagation delay both ways.

**NOTE:** You can find a detailed description of the NED language in the
<a href="../manual/index.html#cha:ned-lang" target="blank">OMNeT++ Simulation Manual</a>.
(The manual can also be found in the `doc`  directory of your OMNeT++ installation.)
{:.well}


### 1.4 Adding the C++ files

We now need to implement the functionality of the Txc1 simple module in C++.
Create a file named `txc1.cc` by choosing *New -> Source File* from the
project's context menu (or *File -> New -> File* from the IDE's main menu),
and enter the following content:

@dontinclude txc1.cc
@skip #include
@until // send out the message
@skipline }

The `Txc1` simple module type is represented by the C++ class `Txc1`. The `Txc1`
class needs to subclass from OMNeT++'s `cSimpleModule` class, and needs to be
registered in OMNeT++ with the `Define_Module()` macro.

**NOTE:** It is a common mistake to forget the `Define_Module()` line. If it is missing,
you'll get an error message similar to this one: `"Error: Class 'Txc1' not found -- perhaps
its code was not linked in, or the class wasn't registered with Register_Class(), or in
the case of modules and channels, with Define_Module()/Define_Channel()"`.
{:.well}

We redefine two methods from `cSimpleModule`: `initialize()` and `handleMessage()`.
They are invoked from the simulation kernel: the first one only once, and
the second one whenever a message arrives at the module.

In `initialize()` we create a message object ([`cMessage`]), and send it out
on gate `out`. Since this gate is connected to the other module's
input gate, the simulation kernel will deliver this message to the other module
in the argument to `handleMessage()` -- after a 100ms propagation delay
assigned to the link in the NED file. The other module just sends it back
(another 100ms delay), so it will result in a continuous ping-pong.

Messages (packets, frames, jobs, etc) and events (timers, timeouts) are
all represented by cMessage objects (or its subclasses) in OMNeT++.
After you send or schedule them, they will be held by the simulation
kernel in the "scheduled events" or "future events" list until
their time comes and they are delivered to the modules via `handleMessage()`.

Note that there is no stopping condition built into this simulation:
it would continue forever. You will be able to stop it from the GUI.
(You could also specify a simulation time limit or CPU time limit
in the configuration file, but we don't do that in the tutorial.)


### 1.5  Adding omnetpp.ini

To be able to run the simulation, we need to create an `omnetpp.ini` file.
`omnetpp.ini` tells the simulation program which network you want to simulate
(as NED files may contain several networks), you can pass parameters
to the model, explicitly specify seeds for the random number generators, etc.

Create an `omnetpp.ini` file using the *File -> New -> Initialization file (INI)*
menu item. The new file will open in an *Inifile Editor*.
As the NED Editor, the Inifile Editor also has two modes, *Form* and *Source*,
which edit the same content. The former is more suitable for configuring the
simulation kernel, and the latter for entering module parameters.

For now, just switch to *Source* mode and enter the following:

<pre>
[General]
network = Tictoc1
</pre>

You can verify the result in *Form* mode:

<img src="images/inieditor.png" width="650px">

`tictoc2` and further steps will all share a common <a srcfile="tictoc/code/omnetpp.ini"/> file.

We are now done with creating the first model, and ready to compile and run it.

Sources: <a srcfile="tictoc/code/tictoc1.ned"/>, <a srcfile="tictoc/code/txc1.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>

----------------------------------------------------------------------------

## Part 2 - Running the simulation

### 2.1 Launching the simulation program

Once you complete the above steps, you can launch the simulation by selecting
%omnetpp.ini (in either the editor area or the *Project Explorer*),
and pressing the *Run* button.

<img src="images/run.png">

The IDE will build your project automatically. If there are compilation errors,
you need to rectify those until you get an error-free compilation and linking.
You can manually trigger a build by hitting choosing *Project -> Build All*
from the menu, or hitting *Ctrl+B*.

**NOTE:** If you want to build the simulation executable on the command-line,
create a *Makefile* using the `opp_makemake`
command, then enter `make` to build the project. It will produce
an executable that can be run by entering `./tictoc`.
{:.well}

### 2.2 Running the simulation

After successfully building and launching your simulation, you should see
a new GUI window appear, similar to the one in the screenshot below.
The window belongs to *Qtenv*, the main OMNeT++ simulation runtime GUI.
You should also see the network containing *tic* and *toc* displayed
graphically in the main area.

Press the *Run* button on the toolbar to start the simulation. What you should
see is that *tic* and *toc* are exchanging messages with each other.

<img src="images/tictoc1_3.gif">

The main window toolbar displays the current simulation time. This is virtual time,
it has nothing to do with the actual (or wall-clock) time that the program takes to
execute. Actually, how many seconds you can simulate in one real-world second
depends highly on the speed of your hardware and even more on the nature and
complexity of the simulation model itself.

Note that it takes zero simulation time for a node to process the message.
The only thing that makes the simulation time pass in this model is
the propagation delay on the connections.

You can play with slowing down the animation or making it faster with
the slider at the top of the graphics window. You can stop the simulation
by hitting F8 (equivalent to the STOP button on the toolbar), single-step
through it (F4), run it with (F5) or without (F6) animation.
F7 (express mode) completely turns off tracing features for maximum speed.
Note the event/sec and simsec/sec gauges on the status bar of the
main window (only visible when the simulation is running in fast or express mode).

**Exercise:** Explore the GUI by running the simulation several times. Try
*Run*, *Run Until*, *Rebuild Network*, and other functions.
{:.well}

You can exit the simulation program by clicking its *Close* icon or
choosing *File -> Exit*.


### 2.3 Debugging

The simulation is just a C++ program, and as such, it often needs to be
debugged while it is being developed. In this section we'll look at the
basics of debugging to help you acquire this vital task.

The simulation can be started in debug mode by clicking the *Debug*
button on the IDE's main toolbar.

<img src="images/debug.png">

This will cause the simulation program to be launched under a debugger
(usually *gdb*). The IDE will also switch into "Debug perspective",
i.e. rearrange its various panes and views to a layout which is better
suited to debugging. You can end the debugging session with the
*Terminate* button (a red square) on the toolbar.


<b>Runtime errors</b>

Debugging is most often needed to track down runtime errors. Let's try it!
First, deliberately introduce an error into the program. In
<a srcfile="tictoc/code/txc1.cc"/>, duplicate the `send()` line inside
 `handleMessage()`, so that the code looks like this:

<pre>
void Txc1::handleMessage(cMessage *msg)
{
    //...
    send(msg, "out"); // send out the message
    send(msg, "out"); // THIS SHOULD CAUSE AN ERROR
}
</pre>

When you launch the simulation in normal mode (*Run* button) and try to run it,
you'll get an error message like this:

<img src="images/error.png" width="450px">

Now, run the simulation in *Debug* mode. Due to a `debug-on-errors` option
being enabled by default, the simulation program will stop in the debugger.
You can locate the error by examining the stack trace (the list of nested
function calls) in the *Debug* view:

<img src="images/stacktrace.png" width="600px">

You can see that it was OMNeT++'s `breakIntoDebuggerIfRequested()` method that
activated the debugger. From then on, you need to search for a function that
looks familiar, i.e. for one that is part of the model. In our case, that is
the "Txc1::handleMessage() at txc1.cc:54" line. Selecting that line will
show you the corresponding source code in the editor area, and lets you
examine the values of variables in the *Variables* view. This information
will help you determine the cause of the error and fix it.

<b>Crashes</b>

Tracking down crashes i.e. segfaults is similar, let's try that as well.
Undo the previous source code edit (remove the duplicate `send()` line),
and introduce another error. Let's pretend we forgot to create the message
before sending it, and change the following lines in `initialize()`

<pre>
        cMessage *msg = new cMessage("tictocMsg");
        send(msg, "out");
</pre>

to simply

<pre>
        cMessage *msg; // no initialization!
        send(msg, "out");
</pre>

When you run the simulation, it will crash. (You will get an error message
similar to "Simulation terminated with exit code: 139"). If you launch the simulation
again, this time in *Debug* mode, the crash will bring you into the debugger.
Once there, you'll be able to locate the error in the *Debug* view and examine
variables, which will help you identify and fix the bug.

<b>Breakpoints</b>

You can also manually place breakpoints into the code. Breakpoints will stop
execution, and let you examine variables, execute the code line-by-line,
or resume execution (until the next breakpint).

A breakpoint can be placed at a specific line in the source code by double-clicking
on the left gutter in the editor, or choosing *Toggle Breakpoint* from
the context menu. The list of active (and inactive) breakpoints can be examined
in the *Breakpoints* view.

**Exercise:** Experiment with breakpoints! Place a breakpoint at the beginning of
the `handleMessage()` method function, and run the simulation. Use appropriate
buttons on the toolbar to single-step, continue execution until next time the
breakpoint is hit, and so on.
{:.well}

<b>"Debug next event"</b>

If you did the previous exercise, you must have noticed that the breakpoint
was triggered at each and every event in the Txc1 simple module. In real life
it often occurs that an error only surfaces at, say, the 357th event in that module,
so ideally that's when you'd want to start debugging. It is not very convenient
to have to hit *Resume* 356 times just to get to the place of the error.
A possible solution is to add a *condition* or an *ignore*-count to the
breakpoint (see *Breakpoint Properties* in its context menu). However,
there is a potentially more convenient solution.

In *Qtenv*, use *Run Until* to get to the event to be debugged. Then,
choose *Simulation -> Debug Next Event* from the menu. This will trigger
a breakpoint in the debugger at the beginning of `handleMessage()` of the
next event, and you can start debugging that event.

<img src="images/debugnextevent.png">

### 2.4 The Debug/Run dialog

Let us return to launching simulations once more.

When you launch the simulation program with the *Run* or *Debug*
buttons on the IDE toolbar, settings associated with the launch
are saved in a *launch configuration*. Launch configurations
can be viewed in the *Run/Debug Configurations* dialog which
can be opened e.g. by clicking the little *down* arrow next to the
*Run* (*Debug*) toolbar button to open a menu, and choosing
*Run (Debug) Configurations...* in it. In the same menu, you can also
click the name of a launch configuration (e.g. *tictoc*) while
holding down the Ctrl key to open the dialog with the corresponding
configuration.

The dialog allows you activate various settings for the launch.

<img src="images/launchdialog.png" width="550px">


### 2.5 Visualizing on a Sequence Chart

The OMNeT++ simulation kernel can record the message exchanges during the
simulation into an *event log file*. To enable recording the event log,
check the *Record eventlog* checkbox in the launch configuration dialog.
Alternatively, you can specify *record-eventlog = true* in omnetpp.ini,
or even, use the *Record* button in the Qtenv graphical runtime environment
after launching,

The log file can be analyzed later with the *Sequence Chart* tool in the IDE.
The `results` directory in the project folder contains the `.elog` file.
Double-clicking on it in the OMNeT++ IDE opens the Sequence Chart tool,
and the event log tab at the bottom of the window.

**NOTE:** The resulting log file can be quite large, so enable this feature only
if you really need it.
{:.well}

The following figure has been created with the *Sequence Chart* tool, and shows
how the message is routed between the different nodes in the network.
In this instance the chart is very simple, but when you have a complex model,
sequence charts can be very valuable in debugging, exploring or documenting
the model's behaviour.

<img src="images/eventlog.png">


Sources: <a srcfile="tictoc/code/tictoc1.ned"/>, <a srcfile="tictoc/code/txc1.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>

----------------------------------------------------------------------------

## Part 3 - Enhancing the 2-node TicToc

### 3.1 Adding icons

Here we make the model look a bit prettier in the GUI. We assign
the `block/routing` icon (the file `images/block/routing.png`), and paint it cyan for `tic`
and yellow for `toc`. This is achieved by adding display strings to the
NED file. The `i=` tag in the display string specifies the icon.

@dontinclude tictoc2.ned
@skip Here we make
@until toc.out
@skipline }

You can see the result here:

<img src="images/step2a.png">


### 3.2 Adding logging

We also modify the C++ code. We add log statements to `Txc1` so that it
prints what it is doing. OMNeT++ provides a sophisticated logging facility
with log levels, log channels, filtering, etc. that are useful for large
and complex models, but in this model we'll use its simplest form `EV`:

@dontinclude txc2.cc
@skipline EV <<

and

@skipline EV <<

When you run the simulation in the OMNeT++ runtime environment, the following output
will appear in the log window:

<img src="images/step2b.png">

You can also open separate output windows for *tic* and *toc* by right-clicking
on their icons and choosing *Component log* from the menu. This feature
will be useful when you have a large model ("fast scrolling logs syndrome")
and you're interested only in the log messages of specific module.

<img src="images/step2c.png">

Sources: <a srcfile="tictoc/code/tictoc2.ned"/>, <a srcfile="tictoc/code/txc2.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>


### 3.3 Adding state variables

In this step we add a counter to the module, and delete the message
after ten exchanges.

We add the counter as a class member:

@dontinclude txc3.cc
@skip class Txc3
@until protected:

We set the variable to 10 in `initialize()` and decrement in `handleMessage()`,
that is, on every message arrival. After it reaches zero, the simulation
will run out of events and terminate.

Note the

@dontinclude txc3.cc
@skipline WATCH(c

line in the source: this makes it possible to see the counter value
in the graphical runtime environment.

If you click on `tic`'s icon, the inspector window in the bottom left corner of the main window will display
details about `tic`. Make sure that *Children* mode is selected from the toolbar at the top.
The inspector now displays the counter variable.

<img src="images/inspector.png">

As you continue running the simulation, you can follow as the counter
keeps decrementing until it reaches zero.

Sources: <a srcfile="tictoc/code/tictoc3.ned"/>, <a srcfile="tictoc/code/txc3.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>


### 3.4 Adding parameters

In this step you'll learn how to add input parameters to the simulation:
we'll turn the "magic number" 10 into a parameter and add a boolean parameter
to decide whether the module should send out the first message in its
initialization code (whether this is a `tic` or a `toc` module).

Module parameters have to be declared in the NED file. The data type can
be numeric, string, bool, or xml (the latter is for easy access to
XML config files), among others.

@dontinclude tictoc4.ned
@skip simple
@until gates

We also have to modify the C++ code to read the parameter in
initialize(), and assign it to the counter.

@dontinclude txc4.cc
@skipline par("limit")

We can use the second parameter to decide whether to send initial message:

@dontinclude txc4.cc
    @skipline par("sendMsgOnInit")

Now, we can assign the parameters in the NED file or from `omnetpp.ini`.
Assignments in the NED file take precedence. You can define default
values for parameters if you use the `default(...)` syntax
in the NED file. In this case you can either set the value of the
parameter in omnetpp.ini or use the default value provided by the NED file.

Here, we assign one parameter in the NED file:

@dontinclude tictoc4.ned
@skip network
@until connections

and the other in `omnetpp.ini`:

@dontinclude omnetpp.ini
@skipline Tictoc4.toc

Note that because omnetpp.ini supports wildcards, and parameters
assigned from NED files take precedence over the ones in omnetpp.ini,
we could have used

<pre>
Tictoc4.t*c.limit=5
</pre>

or

<pre>
Tictoc4.*.limit=5
</pre>

or even

@verbatim
**.limit=5
@endverbatim

with the same effect. (The difference between `*` and `**` is that `*` will not match
a dot and `**` will.)

In the graphical runtime environment, you can inspect module parameters either in the object tree
on the left-hand side of the main window, or in the Parameters page of
the module inspector (information is shown in the bottom left corner of the main window after
clicking on a module).

The module with the smaller limit will delete the message and thereby
conclude the simulation.

Sources: <a srcfile="tictoc/code/tictoc4.ned"/>, <a srcfile="tictoc/code/txc4.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>


### 3.5 Using NED inheritance

If we take a closer look at the NED file we will realize that `tic`
and `toc` differs only in their parameter values and their display string.
We can create a new simple module type by inheriting from an other one and specifying
or overriding some of its parameters. In our case we will derive two simple
module types (`Tic` and `Toc`). Later we can use these types when defining
the submodules in the network.

Deriving from an existing simple module is easy. Here is the base module:

@dontinclude tictoc5.ned
@skip simple Txc5
@until }

And here is the derived module. We just simply specify the parameter values and add some
display properties.

@dontinclude tictoc5.ned
@skip simple Tic5
@until }

The `Toc` module looks similar, but with different parameter values.
@dontinclude tictoc5.ned
@skip simple Toc5
@until }

**NOTE:** The C++ implementation is inherited from the base simple module (`Txc5`).
{:.well}

Once we created the new simple modules, we can use them as submodule types in our network:

@dontinclude tictoc5.ned
@skip network
@until connections

As you can see, the network definition is much shorter and simpler now.
Inheritance allows you to use common types in your network and avoid
redundant definitions and parameter settings.


### 3.6 Modeling processing delay

In the previous models, `tic` and `toc` immediately sent back the
received message. Here we'll add some timing: `tic` and `toc` will hold the
message for 1 simulated second before sending it back. In OMNeT++
such timing is achieved by the module sending a message to itself.
Such messages are called self-messages (but only because of the way they
are used, otherwise they are ordinary message objects).

We added two cMessage * variables, `event` and `tictocMsg`
to the class, to remember the message we use for timing and message whose
processing delay we are simulating.

@dontinclude txc6.cc
@skip class Txc6
@until public:

We "send" the self-messages with the scheduleAt() function, specifying
when it should be delivered back to the module.

@dontinclude txc6.cc
@skip ::handleMessage
@skipline scheduleAt(

In `handleMessage()` now we have to differentiate whether a new message
has arrived via the input gate or the self-message came back
(timer expired). Here we are using

@dontinclude txc6.cc
@skipline msg ==

but we could have written

<pre>
    if (msg->isSelfMessage())
</pre>

as well.

We have left out the counter, to keep the source code small.

While running the simulation you will see the following log output:

<img src="images/step6.png">

Sources: <a srcfile="tictoc/code/tictoc6.ned"/>, <a srcfile="tictoc/code/txc6.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>


### 3.7 Random numbers and parameters

In this step we'll introduce random numbers. We change the delay from 1s
to a random value which can be set from the NED file or from omnetpp.ini.
Module parameters are able to return random variables; however, to make
use of this feature we have to read the parameter in `handleMessage()`
every time we use it.

@dontinclude txc7.cc
@skip The "delayTime" module parameter
@until scheduleAt(

In addition, we'll "lose" (delete) the packet with a small (hardcoded) probability.

@dontinclude txc7.cc
@skip uniform(
@until }

We'll assign the parameters in omnetpp.ini:

@dontinclude omnetpp.ini
@skipline Tictoc7.
@skipline Tictoc7.

You can try that no matter how many times you re-run the simulation (or
restart it, *Simulate -> Rebuild network* menu item), you'll get exactly the
same results. This is because OMNeT++ uses a deterministic algorithm
(by default the Mersenne Twister RNG) to generate random numbers, and
initializes it to the same seed. This is important for reproducible
simulations. You can experiment with different seeds if you add the
following lines to omnetpp.ini:

<pre>
[General]
seed-0-mt=532569  # or any other 32-bit value
</pre>

From the syntax you have probably guessed that OMNeT++ supports
more than one RNGs. That's right, however, all models in this tutorial
use RNG 0.

**Exercise:** Try other distributions as well.
{:.well}

Sources: <a srcfile="tictoc/code/tictoc8.ned"/>, <a srcfile="tictoc/code/txc7.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>


### 3.8 Timeout, cancelling timers

In order to get one step closer to modelling networking protocols,
let us transform our model into a stop-and-wait simulation.
This time we'll have separate classes for `tic` and `toc`. The basic
scenario is similar to the previous ones: `tic` and `toc` will be tossing a
message to one another. However, `toc` will "lose" the message with some
nonzero probability, and in that case `tic` will have to resend it.

Here's `toc`'s code:

@dontinclude txc8.cc
@skip Toc8::handleMessage(
@until else

Thanks to the `bubble()` call in the code, `toc` will display a callout whenever
it drops the message.

<img src="images/step8.png">

So, `tic` will start a timer whenever it sends the message. When
the timer expires, we'll assume the message was lost and send another
one. If `toc`'s reply arrives, the timer has to be cancelled.
The timer will be (what else?) a self-message.

@dontinclude txc8.cc
@skip Tic8::handleMessage
@skipline scheduleAt(

Cancelling the timer will be done with the `cancelEvent()` call. Note that
this does not prevent us from being able to reuse the same
timeout message over and over.

@dontinclude txc8.cc
@skip Tic8::handleMessage
@skipline cancelEvent(

You can read Tic's full source in <a srcfile="tictoc/code/txc8.cc."/>

Sources: <a srcfile="tictoc/code/tictoc8.ned"/>, <a srcfile="tictoc/code/txc8.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>


### 3.9 Retransmitting the same message

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

@dontinclude txc9.cc
@skip Tic9::generateNewMessage
@until }

@dontinclude txc9.cc
@skip Tic9::sendCopyOf
@until }

Sources: <a srcfile="tictoc/code/tictoc9.ned"/>, <a srcfile="tictoc/code/txc9.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>


## Part 4 - Turning it into a real network

### 4.1 More than two nodes

Now we'll make a big step: create several `tic` modules and connect
them into a network. For now, we'll keep it simple what they do:
one of the nodes generates a message, and the others keep tossing
it around in random directions until it arrives at
a predetermined destination node.

The NED file will need a few changes. First of all, the `Txc` module will
need to have multiple input and output gates:

@dontinclude tictoc10.ned
@skip simple Txc10
@until }

The `[ ]` turns the gates into gate vectors. The size of the vector
(the number of gates) will be determined where we use Txc to build
the network.

@skip network Tictoc10
@until tic[5].out
@until }

Here we created 6 modules as a module vector, and connected them.

The resulting topology looks like this:

<img src="images/step10.png">

In this version, `tic[0]` will generate the message to be sent around.
This is done in `initialize()`, with the help of the `getIndex()` function which
returns the index of the module in the vector.

The meat of the code is the `forwardMessage()` function which we invoke
from `handleMessage()` whenever a message arrives at the node. It draws
a random gate number, and sends out message on that gate.

@dontinclude txc10.cc
@skip ::forwardMessage
@until }

When the message arrives at `tic[3]`, its `handleMessage()` will delete the message.

See the full code in <a srcfile="tictoc/code/txc10.cc."/>

**Exercise:** you'll notice that this simple "routing" is not very efficient:
often the packet keeps bouncing between two nodes for a while before it is sent
to a different direction. This can be improved somewhat if nodes don't send
the packet back to the sender. Implement this. Hints: `cMessage::getArrivalGate()`,
`cGate::getIndex()`. Note that if the message didn't arrive via a gate but was
a self-message, then `getArrivalGate()` returns `NULL`.
{:.well}

Sources: <a srcfile="tictoc/code/tictoc10.ned"/>, <a srcfile="tictoc/code/txc10.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>


### 4.2 Channels and inner type definitions

Our new network definition is getting quite complex and long, especially
the connections section. Let's try to simplify it. The first thing we
notice is that the connections always use the same `delay` parameter.
It is possible to create types for the connections (they are called channels)
similarly to simple modules. We should create a channel type which specifies the
delay parameter and we will use that type for all connections in the network.

@dontinclude tictoc11.ned
@skip network
@until submodules

As you have noticed we have defined the new channel type inside the network definition
by adding a `types` section. This type definition is only visible inside the
network. It is called as a local or inner type. You can use simple modules as inner types
too, if you wish.

**NOTE:** We have created the channel by specializing the built-in `DelayChannel`.
(built-in channels can be found inside the `ned` package. Thats why we used
the full type name `ned.DelayChannel`) after the `extends` keyword.
{:.well}

Now let's check how the `connections` section changed.

@dontinclude tictoc11.ned
@skip connections
@until }

As you see we just specify the channel name inside the connection definition.
This allows to easily change the delay parameter for the whole network.

Sources: <a srcfile="tictoc/code/tictoc11.ned"/>, <a srcfile="tictoc/code/txc11.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>


### 4.3 Using two-way connections

If we check the `connections` section a little more, we will realize that
each node pair is connected with two connections. One for each direction.
OMNeT++ 4 supports two way connections, so let's use them.

First of all, we have to define two-way (or so called `inout`) gates instead of the
separate `input` and `output` gates we used previously.

@dontinclude tictoc12.ned
@skip simple
@until }

The new `connections` section would look like this:

@dontinclude tictoc12.ned
@skip connections:
@until }

We have modified the gate names so we have to make some modifications to the
C++ code.

@dontinclude txc12.cc
@skip Txc12::forwardMessage
@until }

**NOTE:** The special $i and $o suffix after the gate name allows us to use the
connection's two direction separately.
{:.well}

Sources: <a srcfile="tictoc/code/tictoc12.ned"/>, <a srcfile="tictoc/code/txc12.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>


### 4.4 Defining our message class

In this step the destination address is no longer hardcoded `tic[3]` -- we draw a
random destination, and we'll add the destination address to the message.

The best way is to subclass cMessage and add destination as a data member.
Hand-coding the message class is usually tedious because it contains
a lot of boilerplate code, so we let OMNeT++ generate the class for us.
The message class specification is in `tictoc13.msg`:

@dontinclude tictoc13.msg
@skip message TicTocMsg13
@until }

**NOTE:** See <a href="../manual/index.html#cha:msg-def" target="_blank">Section 6</a> of the OMNeT++ manual for more details on messages.
{:.well}

The makefile is set up so that the message compiler, opp_msgc is invoked
and it generates `tictoc13_m.h` and `tictoc13_m.cc` from the message declaration
(The file names are generated from the `tictoc13.msg` file name, not the message type name).
They will contain a generated `TicTocMsg13` class subclassed from [`cMessage`];
the class will have getter and setter methods for every field.

We'll include `tictoc13_m.h` into our C++ code, and we can use `TicTocMsg13` as
any other class.

@dontinclude txc13.cc
@skipline tictoc13_m.h

For example, we use the following lines in `generateMessage()` to create the
message and fill its fields.

@skip ::generateMessage(
@skip TicTocMsg13 *msg
@until return msg

Then, `handleMessage()` begins like this:

@dontinclude txc13.cc
@skip ::handleMessage(
@until getDestination

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
address, and so forth. Read the full code: <a srcfile="tictoc/code/txc13.cc."/>

When you run the model, it'll look like this:

<img src="images/step13a.png">

You can click on the messages to see their content in the inspector window.
Double-clicking will open the inspector in a new window.
(You'll either have to temporarily stop the simulation for that,
or to be very fast in handling the mouse). The inspector window
displays lots of useful information; the message fields can be seen
on the *Contents* page.

<img src="images/step13b.png">

Sources: <a srcfile="tictoc/code/tictoc13.ned"/>, <a srcfile="tictoc/code/tictoc13.msg"/>, <a srcfile="tictoc/code/txc13.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>

**Exercise:** In this model, there is only one message underway at any
given moment: nodes only generate a message when another message arrives
at them. We did it this way to make it easier to follow the simulation.
Change the module class so that instead, it generates messages periodically.
The interval between messages should be a module parameter, returning
exponentially distributed random numbers.
{:.well}

## Part 5 - Adding statistics collection

### 5.1 Displaying the number of packets sent/received

To get an overview at runtime how many messages each node sent or
received, we've added two counters to the module class: numSent and numReceived.

@dontinclude txc14.cc
@skip class Txc14
@until protected:

They are set to zero and `WATCH`'ed in the `initialize()` method. Now we
can use the *Find/inspect* objects dialog (*Inspect* menu; it is also on
the toolbar) to learn how many packets were sent or received by the
various nodes.

<img src="images/step14a.png">

It's true that in this concrete simulation model the numbers will be
roughly the same, so you can only learn from them that `intuniform()`
works properly. But in real-life simulations it can be very useful that
you can quickly get an overview about the state of various nodes in the
model.

It can be also arranged that this info appears above the module
icons. The `t=` display string tag specifies the text;
we only need to modify the displays string during runtime.
The following code does the job:

@dontinclude txc14.cc
@skip ::refreshDisplay
@until }

And the result looks like this:

<img src="images/step14b.png">

Sources: <a srcfile="tictoc/code/tictoc14.ned"/>, <a srcfile="tictoc/code/tictoc14.msg"/>, <a srcfile="tictoc/code/txc14.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>


### 5.2 Adding statistics collection

The previous simulation model does something interesting enough
so that we can collect some statistics. For example, you may be interested
in the average hop count a message has to travel before reaching
its destination.

We'll record in the hop count of every message upon arrival into
an output vector (a sequence of (time,value) pairs, sort of a time series).
We also calculate mean, standard deviation, minimum, maximum values per node, and
write them into a file at the end of the simulation. Then we'll use
tools from the OMNeT++ IDE to analyse the output files.

For that, we add an output vector object (which will record the data into
`Tictoc15-#0.vec`) and a histogram object (which also calculates mean, etc)
to the class.

@dontinclude txc15.cc
@skipline class Txc15
@until protected:

When a message arrives at the destination node, we update the statistics.
The following code has been added to `handleMessage()`:

@skip ::handleMessage
@skipline hopCountVector.record
@skipline hopCountStats.collect

The `hopCountVector.record()` call writes the data into `Tictoc15-#0.vec`.
With a large simulation model or long execution time, the `Tictoc15-#0.vec` file
may grow very large. To handle this situation, you can specifically
disable/enable vector in omnetpp.ini, and you can also specify
a simulation time interval in which you're interested
(data recorded outside this interval will be discarded.)

When you begin a new simulation, the existing `Tictoc15-#0.vec/sca`
files get deleted.

Scalar data (collected by the histogram object in this simulation)
have to be recorded manually, in the `finish()` function.
`finish()` is invoked on successful completion of the simulation,
i.e. not when it's stopped with an error. The `recordScalar()` calls
in the code below write into the `Tictoc15-#0.sca` file.

@skip ::finish
@until }

The files are stored in the `results/` subdirectory.

You can also view the data during simulation. To do that, right click on a module, and
choose *Open Details*. In the module inspector's *Contents* page you'll find the `hopCountStats`
and `hopCountVector` objects. To open their inspectors, right click on `cLongHistogram hopCountStats` or
`cOutVector HopCount`, and click `Open Graphical View`.

<img src="images/open_details.png">

The inspector:

<img src="images/open_graphical_view.png">

They will be initially empty -- run the simulation in *Fast* (or even *Express*)
mode to get enough data to be displayed. After a while you'll get something like this:

<img src="images/step15a.png">

<img src="images/step15b.png">

When you think enough data has been collected, you can stop the simulation
and then we'll analyse the result files (`Tictoc15-#0.vec` and
`Tictoc15-#0.sca`) off-line. You'll need to choose *Simulate -> Call finish()*
from the menu (or click the corresponding toolbar button) before exiting --
this will cause the `finish()` functions to run and data to be written into
`Tictoc15-#0.sca`.

Sources: <a srcfile="tictoc/code/tictoc15.ned"/>, <a srcfile="tictoc/code/tictoc15.msg"/>, <a srcfile="tictoc/code/txc15.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>


### 5.3 Statistic collection without modifying your model

In the previous step we have added statistic collection to our model.
While we can compute and save any value we wish, usually it is not known
at the time of writing the model, what data the enduser will need.

OMNeT++ provides an additional mechanism to record values and events.
Any model can emit *signals* that can carry a value or an object. The
model writer just have to decide what signals to emit, what data to attach
to them and when to emit them. The enduser can attach 'listeners' to these
signals that can process or record these data items. This way the model
code does not have to contain any code that is specific to the statistics
collection and the enduser can freely add additional statistics without
even looking into the C++ code.

We will re-write the statistic collection introduced in the last step to
use signals. First of all, we can safely remove all statistic related variables
from our module. There is no need for the `cOutVector` and
`cLongHistogram` classes either. We will need only a single signal
that carries the `hopCount` of the message at the time of message
arrival at the destination.

First we need to define our signal. The `arrivalSignal` is just an
identifier that can be used later to easily refer to our signal.

@dontinclude txc16.cc
@skipline class Txc16
@until protected:

We must register all signals before using them. The best place to do this
is the `initialize()` method of the module.

@skipline ::initialize()
@until getIndex()

Now we can emit our signal, when the message has arrived to the destination node.

@skipline ::handleMessage(
@until EV <<

As we do not have to save or store anything manually, the `finish()` method
can be deleted. We no longer need it.

The last step is that we have to define the emitted signal also in the NED file.
Declaring signals in the NED file allows you to have all information about your
module in one place. You will see the parameters it takes, its input and output
gates, and also the signals and statistics it provides.

@dontinclude tictoc16.ned
@skipline simple
@until display

Now we can define also a statistic that should be collected by default. Our previous example
has collected statistics (max, min, mean, count, etc.) about the hop count of the
arriving messages, so let's collect the same data here, too.

The `source` key specifies the signal we want our statistic to attach to.
The `record` key can be used to tell what should be done with the received
data. In our case we specify that each value must be saved in a vector file (vector)
and also we need to calculate min,max,mean,count etc. (stats). (NOTE: `stats` is
just a shorthand for min, max, mean, sum, count, etc.) With this step we have finished
our model.

Now we have just realized that we would like to see a histogram of the `hopCount` on the
`tic[1]` module. On the other hand we are short on disk storage and we are not interested
having the vector data for the first three module `tic` 0,1,2. No problem. We can add our
histogram and remove the unneeded vector recording without even touching the C++ or NED
files. Just open the INI file and modify the statistic recording:

@dontinclude omnetpp.ini
@skipline Tictoc16
@until tic[0..2]

We can configure a wide range of statistics without even looking into the C++ code,
provided that the original model emits the necessary signals for us.

Sources: <a srcfile="tictoc/code/tictoc16.ned"/>, <a srcfile="tictoc/code/tictoc16.msg"/>, <a srcfile="tictoc/code/txc16.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>


### 5.4 Adding figures

OMNeT++ can display figures on the canvas, such as text, geometric shapes or images.
These figures can be static, or change dinamically according to what happens in the simulation.
In this case, we will display a static descriptive text, and a dynamic text showing the hop count of the last message that arrived at its destination.

We create figures in <a srcfile="tictoc/code/tictoc17.ned"/>, with the `\@figure` property.

@dontinclude tictoc17.ned
@skipline Tictoc17
@until hopCount

This creates two text figures named `description` and `lasthopcount`, and sets their positions on the canvas (we place them in the top right corner).
The `font` attribute sets the figure text's font. It has three parameters: `typeface, size, style`. Any one of them
can be omitted to leave the parameter at default. Here we set the description figure's font to bold.

By default the text in `lasthopcount` is static, but we'll
change it when a message arrives. This is done in <a srcfile="tictoc/code/txc17.cc"/>, in the `handleMessage()` function.

@dontinclude txc17.cc
@skipline hasGUI
@until setText

The figure is represented by the `cTextFigure` C++ class. There are several figure types,
all of them are subclassed from the <a href="file:///home/user/omnetpp-git-tictoc/doc/api/classomnetpp_1_1cFigure.html">`cFigure`</a> base class.
We insert the code responsible for updating the figure text after we retreive the `hopcount` variable.

We want to draw the figures on the network's canvas. The `getParentModule()` function returns the parent of the node, ie. the network.
Then the `getCanvas()` function returns the network's canvas, and `getFigure()` gets the figure by name.
Then, we update the figure's text with the `setText()` function.

**NOTE:** For more information on figures and the canvas, see <a href="../manual/index.html#sec:graphics:canvas" target="_blank">The Canvas</a> section of the OMNeT++ manual
{:.well}

When you run the simulation, the figure displays 'last hopCount: N/A' before the arrival of the first message.
Then, it is updated whenever a message arrives at its destination.

<img src="images/step17.png">

**NOTE:** If the figure text and nodes overlap, press 're-layout'.
{:.well}

<img src="images/relayout.png">

In the last few steps, we have collected and displayed statistics. In the next part,
we'll see and analyze them in the IDE.


Sources: <a srcfile="tictoc/code/tictoc17.ned"/>, <a srcfile="tictoc/code/tictoc17.msg"/>, <a srcfile="tictoc/code/txc17.cc"/>, <a srcfile="tictoc/code/omnetpp.ini"/>


## Part 6 - Visualizing the results with the OMNeT++ IDE

### 6.1 Visualizing output scalars and vectors

The OMNeT++ IDE can help you to analyze your results. It supports filtering,
processing and displaying vector and scalar data, and can display histograms, too.
The following diagrams have been created with the Result Analysis tool of the IDE.

The `results` directory in the project folder contains .vec and .sca files, which are the files that store the results in vector and scalar form, respectively.
Vectors record data values as a function of time, while scalars typically record aggregate values at the end of the simulation.
To open the Result Analysis tool, double click on either the .vec or the .sca files in the OMNeT++ IDE. Both files will be loaded by the Result Analysis tool.
You can find the `Browse Data` tab at the bottom of the Result Analysis tool panel. Here you can browse results by type by switching the various tabs
at the top of the tool panel, ie. Scalars, Vectors, or Histograms. By default, all results of a result type are displayed. You can filter them by the module filter
to view all or some of the individual modules, or the statistic name filter to display different types of statistics, ie. mean, max, min, standard deviation, etc.
You can select some or all of the individual results by highlighting them. If you select multiple results, they will be plotted on one chart. Right click and select Plot to display the figures.

<img src="images/statistics.png">

**NOTE:** For further information about the charting and processing capabilities,
please refer to the <a href="../UserGuide.pdf" target="_blank"><b>OMNeT++ Users Guide</b></a> (you can find it in the `doc` directory of the OMNeT++ installation).
{:.well}

Our last model records the `hopCount` of a message each time the message
reaches its destination.
To plot these vectors for all nodes, select the 6 nodes in the browse data tab.
Right click and select Plot.

<img src="images/selectplot2.png">

We can change various options about how the data on the chart is displayed.
Right click on the chart background, and select Properties.
This opens the *Edit LineChart* window.
In the *Lines* tab, set *Line type* to *Dots*, and *Symbol Type* to *Dot*.

<img src="images/editlinechart2.png" width="850px">

To add a legend to the chart, select *Display legend* on the *Legend* tab.

<img src="images/displaylegend.png">

The chart looks like the following:

<img src="images/hopcountchart.png">

If we apply a `mean` operation we can see how the `hopCount` in the different
nodes converge to an average.
Right-click the chart, and select *Apply -> Mean*.
Again, right-click on the chart background, and select *Properties*.
In the *Lines* tab, set *Line type* to Linear, and *Symbol Type* to None.
The mean is displayed on the following chart. The lines are easier to see this way because they are thinner.

<img src="images/mean3.png">

Scalar data can be plotted on bar charts.
The next chart displays the mean and the maximum of the `hopCount` of the messages
for each destination node, based on the scalar data recorded at the end of the simulation.
In the *Browse data* tab, select *Scalars*. Now select `hop count:max` and `hop count:mean`
for all 6 nodes.


<img src="images/scalars.png">

To create a histogram that shows `hopCount`'s distribution, select *Histograms*
on the *Browse data* tab. Select all nodes, and right click *Plot*.

<img src="images/histogram.png">


## Part 7 - Parameter studies


### 7.1 The goal

We want to run the simulation with a different number of nodes, and see how
the behavior of the network changes. With OMNeT++ you can do parameter studies,
which are multiple simulation runs with different parameter values.

We'll make the number of central nodes (the "handle" in the dumbbell shape) a parameter, and
use the same random routing protocol as before. We're interested in how the average
hop count depends on the number of nodes.

### 7.2 Making the network topology parametric

To parameterize the network, the number of nodes is given as a NED parameter,
`numCentralNodes`. This parameter specifies how many nodes are in the central
section of the network, but doesn't cover the two nodes at each side.

<img src="images/numberofnodes.png">

The total number of nodes including the four nodes on the sides is `numCentralNodes+4`.
The default of the `numCentralNodes` parameter is 2, this corresponds
to the network in the previous step.

@dontinclude tictoc18.ned
@skipline TicToc18
@until Txc18

Now, we must specify that the variable number of nodes should be connected into the dumbbell shape.
First, the two nodes on one side is connected to the third one. Then the the last two nodes on the other side is
connected to the third last. The nodes in the center of the dumbbell can be connected with a for loop.
Starting from the third, each *i*th node is connected to the *i+1*th.

@dontinclude tictoc18.ned
@skipline connections
@until numCentralNodes+3

Here is how the network looks like with `numCentralNodes = 4`:

<img src="images/step18.png">

To run the simulation with multiple different values of `numCentralNodes`, we specify
the variable *N* in the ini file:

@dontinclude omnetpp.ini
@skipline numCentralNodes = $

### 7.3 Setting up a parameter study

We specify that *N* should go from 2 to 100, in steps of 2.
This produces about 50 simulation runs. Each can be explored in the graphical user interface, but
simulation batches are often run from the command line interface using the *Cmdenv* runtime environment.

**NOTE:** You can find more information on variables and parameter studies in the <a href="../manual/index.html#sec:config-sim:parameter-studies" target="_blank">Parameter Studies</a> section of the OMNeT++ manual.
{:.well}

To increase the accuracy of the simulation we may need to run the same simulation several times
using different random numbers. These runs are called *Repetitions* and are specified in `omnetpp.ini`:

@dontinclude omnetpp.ini
@skipline repeat = 4

This means that each simulation run will be executed four times, each time with a different seed for the RNGs.
This produces more samples, which can be averaged. With more repetitions, the results will increasingly converge
to the expected values.

### 7.4 Running the parameter study

Now, we can run the simulations. In the dropdown menu of the *Run* icon, select *Run Configurations*.

<img src="images/runconfig.png">

In the *Run Configurations* dialog, select the config name, make sure *Cmdenv* is selected as the user interface.

<img src="images/runconfig2.png">

If you have a multicore CPU, you can specify how many simulations to run concurrently.

**NOTE:** Alternatively, you can run the simulation batches from the command line with `opp_runall` tool
with the following command:
{:.well}

<pre>
opp_runall -j4 ./tictoc -u Cmdenv -c TicToc18
</pre>

The -j parameter specifies the number of CPU cores, the \c -u parameter the user interface, and \c -c the config to run.


### 7.4 Analyzing the results

Now, we can visualize and analyze the data we've collected from the simulation runs.
We'll display the average hop count for messages that reach their destinations vs *N*, the number of central nodes.
Additionally, we will display the average number of packets that reached their destinations vs *N*.
The analysis file `Tictoc18.anf` contains the dataset we will use for the visualization.

<img src="images/dataset.png">

These two average scalars are not recorded during the simulation, we will have to compute them from the available data.

The hop count is recorded at each node when a message arrives, so the mean of hop count will be available as a statistic.
But this is recorded per node, and we're interested in the average of the mean hop count for all nodes.
The 'Compute Scalar' dataset node can be used to compute scalar statistics from other scalars.
We compute `AvgHopCount` as `mean(**.'hopCount:stats:mean')`.

We're also interested in the average number of packets that arrive at their destination.
The count of the arrived packets is available at each node. We can compute their average,
`AvgNumPackets` as `mean('hopCount:stats:count')`.

**NOTE:** Refer to the chapter "Using the Analysis Editor" in the User Guide for more information on datasets. You can find it in the '/doc' directory of your
OMNeT++ installation.
{:.well}

Then, we plot these two computed scalars against *N* in two scatter charts. The data for different repetitions is automatically averaged.
Here is the average hop count vs *N*:

<img src="images/avghopcount.png">

The average hop count increases as the network gets larger, as packets travel more to reach their destination.
The increase is polynomial. Notice that there are missing values at the far right of the chart.
This is because in such a large network, some packets might not reach their destination in the simulation time limit.
When no packets arrive at a node, the hop count statistic will be *NaN* (not a number) for that node.
When there is a *NaN* in any mathematical expression, its result will be also *NaN*.
Thus it takes just one node in all the simulation runs to have a *NaN* statistic, and the average will be *NaN*, and there'll be no data to display.
This can be remedied by increasing the simulation time limit, so more packets have a chance to arrive.

Below is the average number of packets that arrived vs *N*:

<img src="images/avgnumpackets.png">

Notice that the Y axis is logarithmic. The average number of packets that arrive decreases polynomially
as *N* increases, and the network gets larger.


## Closing words

### Congratulations!

You have successfully completed this tutorial! You have gained a good overview
and the basic skills to work with OMNeT++, from writing simulations to analyzing
results. To go to the next level, we recommend you to read the *Simulation Manual*
and skim through the *User Guide*.

Comments and suggestions regarding this tutorial will be very much appreciated.


[`cMessage`]: https://omnetpp.org/doc/omnetpp/api/classomnetpp_1_1cMessage.html
