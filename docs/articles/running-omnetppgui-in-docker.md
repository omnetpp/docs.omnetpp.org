---
title: OMNeT++ GUI in Docker
author: Attila
date: 2019-09-20
---

A common problem when running various OMNeT++ models is, that sometimes it's very hard to setup and prepare all dependencies
needed by a specific model version. Apart from the trivial dependency on a specific OMNeT++ version, a model may need
other models that introduce additional, sometimes even contradictory requirements.

We started to explore what is the best way to pack all dependencies for easy deployment while also keeping the ability
to run graphical applications. We used VirtualBox images for this purpose in the past, but those can be fairly large
and do not provide the best experience (why would you need a whole another machine with its own OS to try out a piece
of software? Also you have to pre-configure some resource limits like the number of CPU cores, memory size, etc).

We considered packaging OMNeT++ into a Snap, FlatPak, or AppImage package, but these are more for packaging a single
application, while OMNeT++ is more of an environment containing multiple executables (i.e. the IDE and all simulations
created are separate applications really).

We decided to look into the possibility of running the OMNeT++ graphical applications in Docker, too. The main obstacle
is, of course, that Docker does not support these kinds of applications natively. So we tried to find ways to make this
work.

We also looked into remote desktop solutions (like VNC or RDP), where the server runs in the container, and the host
connects to it as a client. These, however, do not provide the most seamless experience (you see a virtual desktop, not
separate windows), and performance/quality might not be the best, even running locally on the same machine. From these
two, RDP seems to be more promising as some versions support seemless mode where applications on the remote machine -
in our case, inside the container - can launch seprate windows on the host display. Sadly the cofiguration of the RDP
server is somewhat complicated.

Another common way to make this work is mapping the Xorg socket into the container, and allowing clients from
“other computers” (the container) to connect to the local X11 server.

With this single command you can try out OMNeT++ on any system with Docker and an X11 server on it:

    docker run --rm -it -v "$(pwd):/root/models" -u "$(id -u):$(id -g)" -v /tmp/.X11-unix:/tmp/.X11-unix -e DISPLAY=$DISPLAY omnetpp/omnetpp-gui:u18.04-5.5.1

The IDE uses the GTK3 backend SWT widgets, while Qtenv uses Qt5, and both of these frameworks come with perfectly
usable Wayland support. Once it becomes more widespread (any year now! :) ), an alternative method where instead of an
Xorg socket, a Wayland socket is mapped in, can be considered.

The [x11docker project](https://github.com/mviereck/x11docker) makes this particularly easy, as it is a collection of
tricks, flags, and methods to run graphical applications in Docker, with several ways of operation, including X11 and
Wayland support, GPU passthrough, all with various levels of isolation and performance, etc. The same effect could be
achived with the following command if `x11docker` is also installed on the machine:

    x11docker -i -- --rm -v "$(pwd):/root/models" -- omnetpp/omnetpp-gui:u18.04-5.5.1

This tool allows also using different technologies like XPRA or NXAGENT that allow even remote access. In this case the
docker image can run on a remote server or in the cloud supporting seemless connection/disconnection.

There are still some limitations and unknowns, like debugging, combining different model frameworks (INET, NeSTiNg,
Veins, CoRE4INET, etc…) in a single project, running on Windows and macOS, and using your favorite tools on the host,
with OMNeT++ running in a container.

Docker is available on Windows and macOS, and you can, of course, start an X11 server on Windows (XMing, VcXsrv) and
macOS (XQuartz), and perhaps a Wayland compositor too in the future. We have not yet tested these, go ahead if you are
interested!

Let us know if you found this interesting or useful. If you have any ideas on how to take it further, what you would
use this for, and what developments you made building on this article!
