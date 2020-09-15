---
title: OMNeT++ Packaging Options
author: Rudolf
date: 2019-09-20
---

## Goals

A common problem when running various OMNeT++ models is that sometimes it's
very hard to setup and prepare all dependencies needed by a specific model
version. Apart from the trivial dependency on a specific OMNeT++ version, a
model may need other models that introduce additional, sometimes even
contradictory requirements.

## Exploring options

We started to explore what is the best way to pack all dependencies for easy
deployment while also keeping the ability to run graphical applications. We used
VirtualBox images for this purpose in the past, but those can be fairly large
and do not provide the best experience (why would you need a whole another
machine with its own OS to try out a piece of software? Also you have to
pre-configure some resource limits like the number of CPU cores, memory size,
etc).

We considered packaging OMNeT++ into a Snap, FlatPak, or AppImage package, but
these are more for packaging a single application, while OMNeT++ is more of an
environment containing multiple executables (i.e. the IDE and all simulations
created are separate applications really).

We decided to look into the possibility of running the OMNeT++ graphical
applications in Docker, too. The main obstacle is, of course, that Docker does
not support these kinds of applications natively. So we tried to find ways to
make this work.

We also looked into remote desktop solutions (like VNC or RDP), where the server
runs in the container, and the host connects to it as a client. These, however,
do not provide the most seamless experience (you see a virtual desktop, not
separate windows), and performance/quality might not be the best, even running
locally on the same machine. From these two, RDP seems to be more promising as
some versions support seamless mode where applications on the remote machine -
in our case, inside the container - can launch separate windows on the host
display. Sadly the configuration of the RDP server is somewhat complicated.

Another common way to make this work is mapping the Xorg socket into the
container, and allowing clients from“other computers” (the container) to connect
to the local X11 server. As Docker is available on Windows and macOS, you can,
of course, start an X11 server on Windows (XMing, VcXsrv) and macOS (XQuartz).

In the future, Wayland may become a viable alternative to X11 in such use cases
as well. The IDE uses SWT widgets with the GTK3 backend, while Qtenv uses Qt5, and
both of these frameworks come with perfectly usable Wayland support. Once it
becomes more widespread.

...

There are still some limitations and unknowns, like debugging, combining
different model frameworks (INET, NeSTiNg, Veins, CoRE4INET, etc…) in a single
project, running on Windows and macOS, and using your favorite tools on the
host, with OMNeT++ running in a container.

## Feedback

If you found this interesting or useful, make use of the it in practice, or you
have ideas on how to take it further, please let us know!
