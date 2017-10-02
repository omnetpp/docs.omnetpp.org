---
layout: page
title: Computing Clouds
---

A computing cloud contains a large collection of multi-core computing nodes,
with a large amount of memory and storage. Nodes are connected with a high-speed
internal network and are attached to the internet also with a high-bandwidth
link. Users do not run their programs directly on the operating system of the
nodes, but rather over some virtualization technology (Xen, KVM, VMWare).
Virtualization isolates cloud users from each other, providing a confined
environment to them, where they can't do any harm to others or the cloud. It
also allows the cloud operator to freeze and resume the user's programs,
transparently migrate them to other nodes, and control their access to resources
like memory and CPU. This way the cloud operator can effectively treat the
computing cluster as a resource pool. This kind of resource sharing is what
allows the cloud services to be provided at a low cost.

Some properties of computing clouds:

 - on-demand or reserved allocation
 - billing based on metered usage
 - different configurations are available (CPU speed, memory size, storage type, network speed)
 - guest OS is typically Linux
 - SSH access is available
 - specialized higher level services are often also offered (machine learning, data mining, 3D rendering, etc.)

There are numerous cloud computing services; in this tutorial we will use AWS
which even offers a free trial period of one year.
