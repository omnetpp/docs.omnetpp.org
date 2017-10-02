---
layout: page
title: Shutting Down
---

To prevent the aimless and useless exhaustion of your Free Tier resource
allowance (or in the long term, your credit card balance), it is important to
terminate your allocated resources once you are done using them. In our case,
these are the EC2 Instances started by the ECS Cluster. We need to shut these
down, because when calculating their usage, the whole amount of time the
instances are running (or paused, but kept available) is taken into account,
not just the time when they were actually used, doing something useful.

If you wish to use the Cluster again later, the easiest thing to do is scaling
down the number of underlying EC2 Instances to `0`. This will of course cause
all running tasks to stop, as they no longer have anything to run on.

<p class="thumbnails">
<img src="images/screenshots/2000_scaleinstances.thumb.jpg" class="screen thumbnail" onclick="imageFullSizeZoom(this);"/>
<img src="images/screenshots/2010_scaletozero.thumb.jpg" class="screen thumbnail" onclick="imageFullSizeZoom(this);"/>
</p>

Alternatively, you can delete the whole Cluster. This will also terminate the
EC2 Instances, but it will delete the `worker` Service as well.

<p class="thumbnails">
<img src="images/screenshots/2020_deletecluster.thumb.jpg" class="screen thumbnail" onclick="imageFullSizeZoom(this);"/>
<img src="images/screenshots/2030_reallydelete.thumb.jpg" class="screen thumbnail" onclick="imageFullSizeZoom(this);"/>
</p>

The Task Definitions are not deleted either way, but this is not a problem,
since they can be kept around indefinitely, free of charge.
