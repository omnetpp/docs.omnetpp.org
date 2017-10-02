---
layout: page
title: Preparation
---

First we need to install a few things on our computer.

## OMNeT++

Download the archive from the [official website](https://omnetpp.org/omnetpp).
Then follow the [Installation
Guide](https://omnetpp.org/doc/omnetpp/InstallGuide.pdf).

The `core` version will work fine as well, if you don't need the IDE.

## Docker

Follow the guides on the official website: [for
Ubuntu](https://docs.docker.com/engine/installation/linux/docker-ce/ubuntu/) or
[for Fedora](https://docs.docker.com/engine/installation/linux/docker-ce/fedora/).

Note that even if your distribution has Docker in its own native package
archive, it is most likely an outdated, and you will have to uninstall it first.

## Python 3 and pip3

We will use Python version 3; and pip, which is the recommended tool for
installing packages from the [Python Package Index](https://pypi.python.org/pypi).
Install these using the native package manager of your distribution.

On Ubuntu:

    $ sudo apt install python3 python3-pip

On Fedora:

    $ sudo dnf install python3 python3-pip

Then, in any case, upgrade `pip`:

    $ sudo pip3 install --upgrade pip

Feel free to use a `virtualenv` for this instead of `sudo` if you're familiar
with the concept.

## RQ

Use `pip` to install the RQ library:

    $ sudo pip3 install rq

This will install the `redis` client module as well, as a dependency.
