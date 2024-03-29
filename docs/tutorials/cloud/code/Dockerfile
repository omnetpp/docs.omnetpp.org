FROM ubuntu:22.04


RUN apt-get update -y && apt-get install -y python3 python3-pip \
      build-essential bison flex libxml2-dev zlib1g-dev wget


RUN pip3 install --upgrade pip && pip3 install rq

# These are necessary to make Click in rq happy.
# See: http://click.pocoo.org/5/python3/#python-3-surrogate-handling
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8


COPY utils.py /opt/
COPY worker.py /opt/


WORKDIR /opt/
RUN wget https://github.com/omnetpp/omnetpp/releases/download/omnetpp-5.6.3/omnetpp-5.6.3-src-core.tgz --progress=dot:giga

RUN tar xf omnetpp-5.6.3-src-core.tgz && rm omnetpp-5.6.3-src-core.tgz


ENV PATH /opt/omnetpp-5.6.3/bin:$PATH
ENV __omnetpp_root_dir /opt/omnetpp-5.6.3

WORKDIR omnetpp-5.6.3
RUN ./configure WITH_TKENV=no WITH_QTENV=no WITH_OSG=no WITH_OSGEARTH=no
RUN make MODE=release -j $(nproc)
WORKDIR /opt/


# These are here just to speed up recompiling the same model code.
# In fact, they should be merged into the apt-get install and ENV
# lines above to reduce image size, and avoid problems, but I think
# it's clearer this way.
RUN apt-get install ccache -y
ENV PATH /usr/lib/ccache:$PATH


ENTRYPOINT ["rq", "worker", "--results-ttl", "60"]
