---
previous_page_disabled: true
next_page_disabled: true
---


!!! attention
    This tutorial is obsolete - it was written before OMNeT++ 6.

    In that version, the result analysis toolset was completely overhauled,
    already relying heavily on Python, NumPy, Pandas, and Matplotlib.
    Both graphical and command-line tools, as well as libraries usable from
    standalone Python scripts are available now, which are preferred over
    the methods described below.


## 1. When to use Python?


The Analysis Tool in the OMNeT++ IDE is best suited for casual exploration of
simulation results. If you are doing sophisticated result analysis, you will
notice after a while that you have outgrown the IDE. The need for customized
charts, the necessity of multi-step computations to produce chart input, or the
sheer volume of raw simulation results might all be causes to make you look for
something else.

If you are an R or Matlab expert, you'll probably reach for those tools, but for
everyone else, Python with the right libraries is pretty much the best choice.
Python has a big momentum for data science, and in addition to having excellent
libraries for data analysis and visualization, it is also a great general-purpose
programming language. Python is used for diverse problems ranging from building
desktop GUIs to machine learning and AI, so the knowledge you gain by learning
it will be convertible to other areas.

This tutorial will walk you through the initial steps of using Python for
analysing simulation results, and shows how to do some of the most common tasks.
The tutorial assumes that you have a working knowledge of OMNeT++ with regard
to result recording, and basic familiarity with Python.


## 2. Setting up


Before we can start, you need to install the necessary software.
First, make sure you have Python, either version 2.x or 3.x (they are
slightly incompatible.) If you have both versions available on your system,
we recommend version 3.x. You also need OMNeT++ version 5.2 or later.

We will heavily rely on three Python packages: [NumPy](http://www.numpy.org/),
[Pandas](http://pandas.pydata.org/), and [Matplotlib](https://matplotlib.org/).
There are also optional packages that will be useful for certain tasks:
[SciPy](https://www.scipy.org/),
[PivotTable.js](https://github.com/nicolaskruchten/pivottable).
We also recommend that you install [IPython](https://ipython.org/) and
[Jupyter](https://jupyter.org/), because they let you work much more comfortably
than the bare Python shell.

On most systems, these packages can be installed with `pip`, the Python package
manager (if you go for Python 3, replace `pip` with `pip3` in the commands
below):


    sudo pip install ipython jupyter
    sudo pip install numpy pandas matplotlib
    sudo pip install scipy pivottablejs


As packages continually evolve, there might be incompatibilities between
versions. We used the following versions when writing this tutorial:
Pandas 0.20.2, NumPy 1.12.1, SciPy 0.19.1, Matplotlib 1.5.1, PivotTable.js 0.8.0.
An easy way to determine which versions you have installed is using the `pip list`
command. (Note that the last one is the version of the Python interface library,
the PivotTable.js main Javascript library uses different version numbers, e.g.
2.7.0.)


## 3. Getting your simulation results into Python


OMNeT++ result files have their own file format which is not directly
digestible by Python. There are a number of ways to get your data
inside Python:

  1. Export from the IDE. The Analysis Tool can export data in a number of
  formats, the ones that are useful here are CSV and Python-flavoured JSON.
  In this tutorial we'll use the CSV export, and read the result into Pandas
  using its `read_csv()` function.

  2. Export using scavetool. Exporting from the IDE may become tedious
  after a while, because you have to go through the GUI every time your
  simulations are re-run. Luckily, you can automate the exporting with
  OMNeT++'s scavetool program. scavetool exposes the same export
  functionality as the IDE, and also allows filtering of the data.

  3. Read the OMNeT++ result files directly from Python. Development
  of a Python package to read these files into Pandas data frames is
  underway, but given that these files are line-oriented text files
  with a straightforward and well-documented structure, writing your
  own custom reader is also a perfectly feasible option.

  4. SQLite. Since version 5.1, OMNeT++ has the ability to record simulation
  results int SQLite3 database files, which can be opened directly from
  Python using the [sqlite](https://docs.python.org/3/library/sqlite3.html)
  package. This lets you use SQL queries to select the input data for your
  charts or computations, which is kind of cool! You can even use GUIs like
  [SQLiteBrowser](http://sqlitebrowser.org/) to browse the database and
  craft your SELECT statements. Note: if you configure OMNeT++ for SQLite3
  output, you'll still get `.vec` and `.sca` files as before, only their
  format will change from textual to SQLite's binary format. When querying
  the contents of the files, one issue  to deal with is that SQLite does not
  allow cross-database queries, so you either need to configure OMNeT++
  to record everything into one file (i.e. each run should append instead
  of creating a new file), or use scavetool's export functionality to
  merge the files into one.

  5. Custom result recording. There is also the option to instrument
  the simulation (via C++ code) or OMNeT++ (via custom result recorders)
  to produce files that Python can directly digest, e.g. CSV.
  However, in the light of the above options, it is rarely necessary
  to go this far.

With large-scale simulation studies, it can easily happen that the
full set of simulation results do not fit into the memory at once.
There are also multiple approaches to deal with this problem:

  1. If you don't need all simulation results for the analysis, you can
  configure OMNeT++ to record only a subset of them. Fine-grained control
  is available.
  2. Perform filtering and aggregation steps before analysis. The IDE and
  scavetool are both capable of filtering the results before export.
  3. When the above approaches are not enough, it can help to move
  part of the result processing (typically, filtering and aggregation)
  into the simulation model as dedicated result collection modules.
  However, this solution requires significantly more work than the previous
  two, so use with care.

In this tutorial, we'll work with the contents of the `samples/resultfiles`
directory distributed with OMNeT++. The directory contains result
files produced by the Aloha and Routing sample simulations, both
of which are parameter studies. We'll start by looking at the Aloha results.

As the first step, we use OMNeT++'s *scavetool* to convert Aloha's scalar files
to CSV. Run the following commands in the terminal (replace `~/omnetpp` with
the location of your OMNeT++ installation):


    cd ~/omnetpp/samples/resultfiles/aloha
    scavetool x *.sca -o aloha.csv


In the scavetool command line, `x` means export, and the export format is
inferred from the output file's extension. (Note that scavetool supports
two different CSV output formats. We need *CSV Records*, or CSV-R for short,
which is the default for the `.csv` extension.)

Let us spend a minute on what the export has created. The CSV file
has a fixed number of columns named `run`, `type`, `module`, `name`,
`value`, etc. Each result item, i.e. scalar, statistic, histogram
and vector, produces one row of output in the CSV. Other items such
as run attributes, iteration variables of the parameter study and result
attributes also generate their own rows. The content of the `type` column
determines what type of information a given row contains. The `type`
column also determines which other columns are in use. For example,
the `binedges` and `binvalues` columns are only filled in for histogram
items. The colums are:

- *run*: Identifies the simulation run
- *type*: Row type, one of the following: `scalar`, `vector`, `statistics`,
  `histogram`, `runattr`, `itervar`, `param`, `attr`
- *module*: Hierarchical name (a.k.a. full path) of the module that recorded the
  result item
- *name*: Name of the result item (scalar, statistic, histogram or vector)
- *attrname*: Name of the run attribute or result item attribute (in the latter
  case, the `module` and `name` columns identify the result item the attribute
  belongs to)
- *attrvalue*: Value of run and result item attributes, iteration variables,
  saved ini param settings (`runattr`, `attr`, `itervar`, `param`)
- *value*: Output scalar value
- *count*, *sumweights*, *mean*, *min*, *max*, *stddev*: Fields of the statistics
  or histogram
- *binedges*, *binvalues*: Histogram bin edges and bin values, as space-separated
  lists. *len(binedges)==len(binvalues)+1*
- *vectime*, *vecvalue*: Output vector time and value arrays, as space-separated
  lists

When the export is done, you can start Jupyter server with the following command:


    jupyter notebook


Open a web browser with the displayed URL to access the Jupyter GUI. Once there,
choose *New* -> *Python3* in the top right corner to open a blank notebook.
The notebook allows you to enter Python commands or sequences of commands,
run them, and view the output. Note that *Enter* simply inserts a newline;
hit *Ctrl+Enter* to execute the commands in the current cell, or *Alt+Enter*
to execute them and also insert a new cell below.

If you cannot use Jupyter for some reason, a terminal-based Python shell
(`python` or `ipython`) will also allow you to follow the tutorial.

On the Python prompt, enter the following lines to make the functionality of
Pandas, NumpPy and Matplotlib available in the session. The last, `%matplotlib`
line is only needed for Jupyter. (It is a "magic command" that arranges plots
to be displayed within the notebook.)

<div class="input-prompt">In[1]:</div>

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
%matplotlib inline
```

We utilize the `read_csv()` function to import the contents of the
CSV file into a data frame. The data frame is the central concept of
Pandas. We will continue to work with this data frame throughout
the whole tutorial.

<div class="input-prompt">In[2]:</div>

```python
aloha = pd.read_csv('aloha.csv')
```

## 4. Exploring the data frame


You can view the contents of the data frame by simply entering the name
of the variable (`aloha`). Alternatively, you can use the `head()` method
of the data frame to view just the first few lines.

<div class="input-prompt">In[3]:</div>

```python
aloha.head()
```

<div class="output-prompt">Out[3]:</div>




<div class="output-html">
<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>run</th>
      <th>type</th>
      <th>module</th>
      <th>name</th>
      <th>attrname</th>
      <th>attrvalue</th>
      <th>value</th>
      <th>count</th>
      <th>sumweights</th>
      <th>mean</th>
      <th>stddev</th>
      <th>min</th>
      <th>max</th>
      <th>binedges</th>
      <th>binvalues</th>
      <th>vectime</th>
      <th>vecvalue</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>configname</td>
      <td>PureAlohaExperiment</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>1</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>datetime</td>
      <td>20170627-20:42:20</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>2</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>experiment</td>
      <td>PureAlohaExperiment</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>3</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>inifile</td>
      <td>omnetpp.ini</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>4</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>iterationvars</td>
      <td>numHosts=10, iaMean=3</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
  </tbody>
</table>
</div>
</div>




You can see that the structure of the data frame, i.e. rows and columns,
directly corresponds to the contents of the CSV file. Column names have
been taken from the first line of the CSV file. Missing values are
represented with NaNs (not-a-number).

The complementary `tail()` method shows the last few lines. There is also
an `iloc` method that we use at places in this tutorial to show rows
from the middle of the data frame. It accepts a range: `aloha.iloc[20:30]`
selects 10 lines from line 20, `aloha.iloc[:5]` is like `head()`, and
`aloha.iloc[-5:]` is like `tail()`.

<div class="input-prompt">In[4]:</div>

```python
aloha.iloc[1200:1205]
```

<div class="output-prompt">Out[4]:</div>




<div class="output-html">
<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>run</th>
      <th>type</th>
      <th>module</th>
      <th>name</th>
      <th>attrname</th>
      <th>attrvalue</th>
      <th>value</th>
      <th>count</th>
      <th>sumweights</th>
      <th>mean</th>
      <th>stddev</th>
      <th>min</th>
      <th>max</th>
      <th>binedges</th>
      <th>binvalues</th>
      <th>vectime</th>
      <th>vecvalue</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>1200</th>
      <td>PureAlohaExperiment-1-20170627-20:42:17-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>collidedFrames:last</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>40692.000000</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>1201</th>
      <td>PureAlohaExperiment-1-20170627-20:42:17-22739</td>
      <td>attr</td>
      <td>Aloha.server</td>
      <td>collidedFrames:last</td>
      <td>source</td>
      <td>sum(collision)</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>1202</th>
      <td>PureAlohaExperiment-1-20170627-20:42:17-22739</td>
      <td>attr</td>
      <td>Aloha.server</td>
      <td>collidedFrames:last</td>
      <td>title</td>
      <td>collided frames, last</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>1203</th>
      <td>PureAlohaExperiment-1-20170627-20:42:17-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>channelUtilization:last</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>0.156176</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>1204</th>
      <td>PureAlohaExperiment-1-20170627-20:42:17-22739</td>
      <td>attr</td>
      <td>Aloha.server</td>
      <td>channelUtilization:last</td>
      <td>interpolationmode</td>
      <td>linear</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
  </tbody>
</table>
</div>
</div>




Hint: If you are in the terminal and you find that the data frame printout does
not make use of the whole width of the terminal, you can increase the display
width for better readability with the following commands:

<div class="input-prompt">In[5]:</div>

```python
pd.set_option('display.width', 180)
pd.set_option('display.max_colwidth', 100)
```

If you have not looked at any Pandas tutorial yet, now is a very good
time to read one. (See References at the bottom of this page for hints.)
Until you finish, here are some basics for your short-term survival.

You can refer to a column as a whole with the array index syntax: `aloha['run']`.
Alternatively, the more convenient member access syntax (`aloha.run`) can
also be used, with restrictions. (E.g. the column name must be valid as a Python
identifier, and should not collide with existing methods of the data frame.
Names that are known to cause trouble include `name`, `min`, `max`, `mean`).

<div class="input-prompt">In[6]:</div>

```python
aloha.run.head()  # .head() is for limiting the output to 5 lines here
```

<div class="output-prompt">Out[6]:</div>




    0    PureAlohaExperiment-4-20170627-20:42:20-22739
    1    PureAlohaExperiment-4-20170627-20:42:20-22739
    2    PureAlohaExperiment-4-20170627-20:42:20-22739
    3    PureAlohaExperiment-4-20170627-20:42:20-22739
    4    PureAlohaExperiment-4-20170627-20:42:20-22739
    Name: run, dtype: object




Selecting multiple columns is also possible, one just needs to use a list of
column names as index. The result will be another data frame. (The double
brackets in the command are due to the fact that both the array indexing and
the list syntax use square brackets.)

<div class="input-prompt">In[7]:</div>

```python
tmp = aloha[['run', 'attrname', 'attrvalue']]
tmp.head()
```

<div class="output-prompt">Out[7]:</div>




<div class="output-html">
<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>run</th>
      <th>attrname</th>
      <th>attrvalue</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>configname</td>
      <td>PureAlohaExperiment</td>
    </tr>
    <tr>
      <th>1</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>datetime</td>
      <td>20170627-20:42:20</td>
    </tr>
    <tr>
      <th>2</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>experiment</td>
      <td>PureAlohaExperiment</td>
    </tr>
    <tr>
      <th>3</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>inifile</td>
      <td>omnetpp.ini</td>
    </tr>
    <tr>
      <th>4</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>iterationvars</td>
      <td>numHosts=10, iaMean=3</td>
    </tr>
  </tbody>
</table>
</div>
</div>




The `describe()` method can be used to get an idea about the contents of a
column. When applied to a non-numeric column, it prints the number of
non-null elements in it (`count`), the number of unique values (`unique`),
the most frequently occurring value (`top`) and its multiplicity (`freq`),
and the inferred data type (more about that later.)

<div class="input-prompt">In[8]:</div>

```python
aloha.module.describe()
```

<div class="output-prompt">Out[8]:</div>




    count             1012
    unique              11
    top       Aloha.server
    freq               932
    Name: module, dtype: object




You can get a list of the unique values using the `unique()` method. For example,
the following command lists the names of modules that have recorded any statistics:

<div class="input-prompt">In[9]:</div>

```python
aloha.module.unique()
```

<div class="output-prompt">Out[9]:</div>




    array([nan, 'Aloha.server', 'Aloha.host[0]', 'Aloha.host[1]',
           'Aloha.host[2]', 'Aloha.host[3]', 'Aloha.host[4]', 'Aloha.host[5]',
           'Aloha.host[6]', 'Aloha.host[7]', 'Aloha.host[8]', 'Aloha.host[9]'],
          dtype=object)




When you apply `describe()` to a numeric column, you get a statistical summary
with things like mean, standard deviation, minimum, maximum, and various
quantiles.

<div class="input-prompt">In[10]:</div>

```python
aloha.value.describe()
```

<div class="output-prompt">Out[10]:</div>




    count      294.000000
    mean      4900.038749
    std      11284.077075
    min          0.045582
    25%          0.192537
    50%        668.925298
    75%       5400.000000
    max      95630.000000
    Name: value, dtype: float64




Applying `describe()` to the whole data frame creates a similar report about
all numeric columns.

<div class="input-prompt">In[11]:</div>

```python
aloha.describe()
```

<div class="output-prompt">Out[11]:</div>




<div class="output-html">
<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>value</th>
      <th>count</th>
      <th>sumweights</th>
      <th>mean</th>
      <th>stddev</th>
      <th>min</th>
      <th>max</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>count</th>
      <td>294.000000</td>
      <td>84.000000</td>
      <td>0.0</td>
      <td>84.000000</td>
      <td>84.000000</td>
      <td>84.000000</td>
      <td>84.000000</td>
    </tr>
    <tr>
      <th>mean</th>
      <td>4900.038749</td>
      <td>5591.380952</td>
      <td>NaN</td>
      <td>1.489369</td>
      <td>0.599396</td>
      <td>1.049606</td>
      <td>6.560987</td>
    </tr>
    <tr>
      <th>std</th>
      <td>11284.077075</td>
      <td>4528.796760</td>
      <td>NaN</td>
      <td>1.530455</td>
      <td>0.962515</td>
      <td>0.956102</td>
      <td>9.774404</td>
    </tr>
    <tr>
      <th>min</th>
      <td>0.045582</td>
      <td>470.000000</td>
      <td>NaN</td>
      <td>0.152142</td>
      <td>0.031326</td>
      <td>0.099167</td>
      <td>0.272013</td>
    </tr>
    <tr>
      <th>25%</th>
      <td>0.192537</td>
      <td>1803.000000</td>
      <td>NaN</td>
      <td>0.164796</td>
      <td>0.049552</td>
      <td>0.099186</td>
      <td>0.498441</td>
    </tr>
    <tr>
      <th>50%</th>
      <td>668.925298</td>
      <td>4065.500000</td>
      <td>NaN</td>
      <td>1.197140</td>
      <td>0.243035</td>
      <td>1.049776</td>
      <td>3.084077</td>
    </tr>
    <tr>
      <th>75%</th>
      <td>5400.000000</td>
      <td>8815.000000</td>
      <td>NaN</td>
      <td>2.384397</td>
      <td>0.741081</td>
      <td>2.000000</td>
      <td>9.000000</td>
    </tr>
    <tr>
      <th>max</th>
      <td>95630.000000</td>
      <td>14769.000000</td>
      <td>NaN</td>
      <td>6.936747</td>
      <td>5.323887</td>
      <td>2.000000</td>
      <td>54.000000</td>
    </tr>
  </tbody>
</table>
</div>
</div>




Let's spend a minute on data types and column data types. Every column has a
data type (abbreviated *dtype*) that determines what type of values it may
contain. Column dtypes can be printed with `dtypes`:

<div class="input-prompt">In[12]:</div>

```python
aloha.dtypes
```

<div class="output-prompt">Out[12]:</div>




    run            object
    type           object
    module         object
    name           object
    attrname       object
    attrvalue      object
    value         float64
    count         float64
    sumweights    float64
    mean          float64
    stddev        float64
    min           float64
    max           float64
    binedges       object
    binvalues      object
    vectime        object
    vecvalue       object
    dtype: object




The two most commonly used dtypes are *float64* and *object*. A *float64* column
contains floating-point numbers, and missing values are represented with NaNs.
An *object* column may contain basically anything -- usually strings, but we'll
also have NumPy arrays (`np.ndarray`) as elements in this tutorial.
Numeric values and booleans may also occur in an *object* column. Missing values
in an *object* column are usually represented with `None`, but Pandas also
interprets the floating-point NaN like that.
Some degree of confusion arises from fact that some Pandas functions check
the column's dtype, while others are already happy if the contained elements
are of the required type. To clarify: applying `describe()` to a column
prints a type inferred from the individual elements, *not* the column dtype.
The column dtype type can be changed with the `astype()` method; we'll see an
example for using it later in this tutorial.

The column dtype can be accessed as the `dtype` property of a column, for example
`aloha.stddev.dtype` yields `dtype('float64')`. There are also convenience
functions such as `is_numeric_dtype()` and `is_string_dtype()` for checking
column dtype. (They need to be imported from the `pandas.api.types` package
though.)

Another vital thing to know, especially due of the existence of the *type*
column in the OMNeT++ CSV format, is how to filter rows. Perhaps surprisingly,
the array index syntax can be used here as well. For example, the following expression
selects the rows that contain iteration variables: `aloha[aloha.type == 'itervar']`.
With a healthy degree of sloppiness, here's how it works: `aloha.type` yields
the values in the `type` column as an array-like data structure;
`aloha.type=='itervar'` performs element-wise comparison and produces an array
of booleans containing `True` where the condition holds and `False` where not;
and indexing a data frame with an array of booleans returns the rows that
correspond to `True` values in the array.

Conditions can be combined with AND/OR using the "`&`" and "`|`" operators, but
you need parentheses because of operator precedence. The following command
selects the rows that contain scalars with a certain name and owner module:

<div class="input-prompt">In[13]:</div>

```python
tmp = aloha[(aloha.type=='scalar') & (aloha.module=='Aloha.server') & (aloha.name=='channelUtilization:last')]
tmp.head()
```

<div class="output-prompt">Out[13]:</div>




<div class="output-html">
<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>run</th>
      <th>type</th>
      <th>module</th>
      <th>name</th>
      <th>attrname</th>
      <th>attrvalue</th>
      <th>value</th>
      <th>count</th>
      <th>sumweights</th>
      <th>mean</th>
      <th>stddev</th>
      <th>min</th>
      <th>max</th>
      <th>binedges</th>
      <th>binvalues</th>
      <th>vectime</th>
      <th>vecvalue</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>1186</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>channelUtilization:last</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>0.156057</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>1203</th>
      <td>PureAlohaExperiment-1-20170627-20:42:17-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>channelUtilization:last</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>0.156176</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>1220</th>
      <td>PureAlohaExperiment-2-20170627-20:42:19-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>channelUtilization:last</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>0.196381</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>1237</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>channelUtilization:last</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>0.193253</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>1254</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>channelUtilization:last</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>0.176507</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
    </tr>
  </tbody>
</table>
</div>
</div>




You'll also need to know how to add a new column to the data frame. Now that is
a bit controversial topic, because at the time of writing, there is a "convenient"
syntax and an "official" syntax for it. The "convenient" syntax is a simple
assignment, for example:

<div class="input-prompt">In[14]:</div>

```python
aloha['qname'] = aloha.module + "." + aloha.name
aloha[aloha.type=='scalar'].head()  # print excerpt
```

<div class="output-prompt">Out[14]:</div>




<div class="output-html">
<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>run</th>
      <th>type</th>
      <th>module</th>
      <th>name</th>
      <th>attrname</th>
      <th>attrvalue</th>
      <th>value</th>
      <th>count</th>
      <th>sumweights</th>
      <th>mean</th>
      <th>stddev</th>
      <th>min</th>
      <th>max</th>
      <th>binedges</th>
      <th>binvalues</th>
      <th>vectime</th>
      <th>vecvalue</th>
      <th>qname</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>1176</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>duration</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>5400.000000</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>Aloha.server.duration</td>
    </tr>
    <tr>
      <th>1177</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>collisionLength:mean</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>0.198275</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>Aloha.server.collisionLength:mean</td>
    </tr>
    <tr>
      <th>1179</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>collisionLength:sum</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>2457.026781</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>Aloha.server.collisionLength:sum</td>
    </tr>
    <tr>
      <th>1181</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>collisionLength:max</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>0.901897</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>Aloha.server.collisionLength:max</td>
    </tr>
    <tr>
      <th>1183</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>collidedFrames:last</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>40805.000000</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>Aloha.server.collidedFrames:last</td>
    </tr>
  </tbody>
</table>
</div>
</div>




It looks nice and natural, but it is not entirely correct. It often results in
a warning: *SettingWithCopyWarning: A value is trying to be set on a copy of a
slice from a DataFrame...*. The message essentially says that the operation
(here, adding the new column) might have been applied to a temporary object
instead of the original data frame, and thus might have been ineffective.
Luckily, that is not the case most of the time (the operation *does* take
effect). Nevertheless, for production code, i.e. scripts, the "official"
solution, the `assign()` method of the data frame is recommended, like this:

<div class="input-prompt">In[15]:</div>

```python
aloha = aloha.assign(qname = aloha.module + "." + aloha.name)
aloha[aloha.type=='scalar'].head()
```

<div class="output-prompt">Out[15]:</div>




<div class="output-html">
<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>run</th>
      <th>type</th>
      <th>module</th>
      <th>name</th>
      <th>attrname</th>
      <th>attrvalue</th>
      <th>value</th>
      <th>count</th>
      <th>sumweights</th>
      <th>mean</th>
      <th>stddev</th>
      <th>min</th>
      <th>max</th>
      <th>binedges</th>
      <th>binvalues</th>
      <th>vectime</th>
      <th>vecvalue</th>
      <th>qname</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>1176</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>duration</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>5400.000000</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>Aloha.server.duration</td>
    </tr>
    <tr>
      <th>1177</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>collisionLength:mean</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>0.198275</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>Aloha.server.collisionLength:mean</td>
    </tr>
    <tr>
      <th>1179</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>collisionLength:sum</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>2457.026781</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>Aloha.server.collisionLength:sum</td>
    </tr>
    <tr>
      <th>1181</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>collisionLength:max</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>0.901897</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>Aloha.server.collisionLength:max</td>
    </tr>
    <tr>
      <th>1183</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server</td>
      <td>collidedFrames:last</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>40805.000000</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>Aloha.server.collidedFrames:last</td>
    </tr>
  </tbody>
</table>
</div>
</div>




For completeness, one can remove a column from a data frame using either the
`del` operator or the `drop()` method of the data frame. Here we show the former
(also to remove the column we added above, as we won't need it for now):

<div class="input-prompt">In[16]:</div>

```python
del aloha['qname']
```

## 5. Revisiting CSV loading


The way we have read the CSV file has one small deficiency: all data in the
`attrvalue` column are represented as strings, event though many of them
are really numbers, for example the values of the `iaMean` and `numHosts`
iteration variables. You can verify that by printing the unique values (
`aloha.attrvalue.unique()` -- it will print all values with quotes), or using
the `type()` operator on an element:

<div class="input-prompt">In[17]:</div>

```python
type( aloha[aloha.type=='scalar'].iloc[0].value )
```

<div class="output-prompt">Out[17]:</div>




    numpy.float64




The reason is that `read_csv()` infers data types of columns from the data
it finds in them. Since the `attrvalue` column is shared by run attributes,
result item attributes, iteration variables and some other types of rows,
there are many non-numeric strings in it, and `read_csv()` decides that it is
a string column.

A similar issue arises with the `binedges`, `binvalues`, `vectime`, `vecvalue`
columns. These columns contain lists of numbers separated by spaces, so they
are read into strings as well. However, we would like to store them as NumPy
arrays (`ndarray`) inside the data frame, because that's the form we can use
in plots or as computation input.

Luckily, `read_csv()` allows us to specify conversion functions for each column.
So, armed with the following two short functions:

<div class="input-prompt">In[18]:</div>

```python
def parse_if_number(s):
    try: return float(s)
    except: return True if s=="true" else False if s=="false" else s if s else None

def parse_ndarray(s):
    return np.fromstring(s, sep=' ') if s else None
```

we can read the CSV file again, this time with the correct conversions:

<div class="input-prompt">In[19]:</div>

```python
aloha = pd.read_csv('aloha.csv', converters = {
    'attrvalue': parse_if_number,
    'binedges': parse_ndarray,
    'binvalues': parse_ndarray,
    'vectime': parse_ndarray,
    'vecvalue': parse_ndarray})
```

You can verify the result e.g. by printing the unique values again.


## 6. Load-time filtering


If the CSV file is large, you may want to skip certain columns or rows when
reading it into memory. (File size is about the only valid reason for using
load-time filtering, because you can also filter out or drop rows/columns
from the data frame when it is already loaded.)

To filter out columns, you need to specify in the `usecols` parameter
the list of columns to keep:

<div class="input-prompt">In[20]:</div>

```python
tmp = pd.read_csv('aloha.csv', usecols=['run', 'type', 'module', 'name', 'value'])
```

There is no such direct support for filtering out rows based on their content,
but we can implement it using the iterator API that reads the CSV file
in chunks. We can filter each chunk before storing and finally concatenating
them into a single data frame:

<div class="input-prompt">In[21]:</div>

```python
iter = pd.read_csv('aloha.csv', iterator=True, chunksize=100)
chunks = [ chunk[chunk['type']!='histogram'] for chunk in iter ]  # discards type=='histogram' lines
tmp = pd.concat(chunks)
```

## 7. Plotting scalars


Scalars can serve as input for many different kinds of plots. Here we'll show
how one can create a "throughput versus offered load" type plot. We will plot
the channel utilization in the Aloha model in the function of the packet
generation frequency. Channel utilization is also affected by the number of
hosts in the network -- we want results belonging to the same number of hosts
to form iso lines. Packet generation frequency and the number of hosts are
present in the results as iteration variables named `iaMean` and `numHosts`;
channel utilization values are the `channelUtilization:last` scalars saved
by the `Aloha.server` module. The data contains the results from two simulation
runs for each *(iaMean, numHosts)* pair done with different seeds; we want
to average them for the plot.

The first few steps are fairly straightforward. We only need the scalars and the
iteration variables from the data frame, so we filter out the rest. Then we
create a `qname` column from other columns to hold the names of our variables:
the names of scalars are in the `module` and `name` columns (we want to join them
with a dot), and the names of iteration variables are in the `attrname` column.
Since `attrname` is not filled in for scalar rows, we can take `attrname` as`qname`
first, then fill in the holes with *module.name*. We use the `combine_first()`
method for that: `a.combine_first(b)` fills the holes in `a` using the
corresponding values from `b`.

The similar issue arises with values: values of output scalars are in the `value`
column, while that of iteration variables are in the `attrvalue` column.
Since `attrvalue` is unfilled for scalar rows, we can again utilize
`combine_first()` to merge two. There is one more catch: we need to change
the dtype of the `attrvalue` to `float64`, otherwise the resulting `value`
column also becomes `object` dtype. (Luckily, all our iteration variables are
numeric, so the dtype conversion is possible. In other simulations that contain
non-numeric itervars, one needs to filter those out, force them into numeric
values somehow, or find some other trick to make things work.)

<div class="input-prompt">In[22]:</div>

```python
scalars = aloha[(aloha.type=='scalar') | (aloha.type=='itervar')]  # filter rows
scalars = scalars.assign(qname = scalars.attrname.combine_first(scalars.module + '.' + scalars.name))  # add qname column
scalars.value = scalars.value.combine_first(scalars.attrvalue.astype('float64'))  # merge value columns
scalars[['run', 'type', 'qname', 'value', 'module', 'name', 'attrname']].iloc[80:90]  # print an excerpt of the result
```

<div class="output-prompt">Out[22]:</div>




<div class="output-html">
<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>run</th>
      <th>type</th>
      <th>qname</th>
      <th>value</th>
      <th>module</th>
      <th>name</th>
      <th>attrname</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>1134</th>
      <td>PureAlohaExperiment-40-20170627-20:42:22-22773</td>
      <td>itervar</td>
      <td>iaMean</td>
      <td>9.000000</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>iaMean</td>
    </tr>
    <tr>
      <th>1135</th>
      <td>PureAlohaExperiment-40-20170627-20:42:22-22773</td>
      <td>itervar</td>
      <td>numHosts</td>
      <td>20.000000</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>numHosts</td>
    </tr>
    <tr>
      <th>1162</th>
      <td>PureAlohaExperiment-41-20170627-20:42:22-22773</td>
      <td>itervar</td>
      <td>iaMean</td>
      <td>9.000000</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>iaMean</td>
    </tr>
    <tr>
      <th>1163</th>
      <td>PureAlohaExperiment-41-20170627-20:42:22-22773</td>
      <td>itervar</td>
      <td>numHosts</td>
      <td>20.000000</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>numHosts</td>
    </tr>
    <tr>
      <th>1176</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server.duration</td>
      <td>5400.000000</td>
      <td>Aloha.server</td>
      <td>duration</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>1177</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server.collisionLength:mean</td>
      <td>0.198275</td>
      <td>Aloha.server</td>
      <td>collisionLength:mean</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>1179</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server.collisionLength:sum</td>
      <td>2457.026781</td>
      <td>Aloha.server</td>
      <td>collisionLength:sum</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>1181</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server.collisionLength:max</td>
      <td>0.901897</td>
      <td>Aloha.server</td>
      <td>collisionLength:max</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>1183</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server.collidedFrames:last</td>
      <td>40805.000000</td>
      <td>Aloha.server</td>
      <td>collidedFrames:last</td>
      <td>NaN</td>
    </tr>
    <tr>
      <th>1186</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>scalar</td>
      <td>Aloha.server.channelUtilization:last</td>
      <td>0.156057</td>
      <td>Aloha.server</td>
      <td>channelUtilization:last</td>
      <td>NaN</td>
    </tr>
  </tbody>
</table>
</div>
</div>




To work further, it would be very convenient if we had a format where each
simulation run corresponds to one row, and all variables produced by that
run had their own columns. We can call it the *wide* format, and it can be
produced using the `pivot()` method:

<div class="input-prompt">In[23]:</div>

```python
scalars_wide = scalars.pivot('run', columns='qname', values='value')
scalars_wide.head()
```

<div class="output-prompt">Out[23]:</div>




<div class="output-html">
<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th>qname</th>
      <th>Aloha.server.channelUtilization:last</th>
      <th>Aloha.server.collidedFrames:last</th>
      <th>Aloha.server.collisionLength:max</th>
      <th>Aloha.server.collisionLength:mean</th>
      <th>Aloha.server.collisionLength:sum</th>
      <th>Aloha.server.duration</th>
      <th>Aloha.server.receivedFrames:last</th>
      <th>iaMean</th>
      <th>numHosts</th>
    </tr>
    <tr>
      <th>run</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>PureAlohaExperiment-0-20170627-20:42:16-22739</th>
      <td>0.156057</td>
      <td>40805.0</td>
      <td>0.901897</td>
      <td>0.198275</td>
      <td>2457.026781</td>
      <td>5400.0</td>
      <td>8496.0</td>
      <td>1.0</td>
      <td>10.0</td>
    </tr>
    <tr>
      <th>PureAlohaExperiment-1-20170627-20:42:17-22739</th>
      <td>0.156176</td>
      <td>40692.0</td>
      <td>0.958902</td>
      <td>0.198088</td>
      <td>2456.494983</td>
      <td>5400.0</td>
      <td>8503.0</td>
      <td>1.0</td>
      <td>10.0</td>
    </tr>
    <tr>
      <th>PureAlohaExperiment-10-20170627-20:42:16-22741</th>
      <td>0.109571</td>
      <td>1760.0</td>
      <td>0.326138</td>
      <td>0.155154</td>
      <td>126.450220</td>
      <td>5400.0</td>
      <td>5965.0</td>
      <td>7.0</td>
      <td>10.0</td>
    </tr>
    <tr>
      <th>PureAlohaExperiment-11-20170627-20:42:16-22741</th>
      <td>0.108992</td>
      <td>1718.0</td>
      <td>0.340096</td>
      <td>0.154529</td>
      <td>125.477252</td>
      <td>5400.0</td>
      <td>5934.0</td>
      <td>7.0</td>
      <td>10.0</td>
    </tr>
    <tr>
      <th>PureAlohaExperiment-12-20170627-20:42:16-22741</th>
      <td>0.090485</td>
      <td>1069.0</td>
      <td>0.272013</td>
      <td>0.152142</td>
      <td>78.201174</td>
      <td>5400.0</td>
      <td>4926.0</td>
      <td>9.0</td>
      <td>10.0</td>
    </tr>
  </tbody>
</table>
</div>
</div>




We are interested in only three columns for our plot:

<div class="input-prompt">In[24]:</div>

```python
scalars_wide[['numHosts', 'iaMean', 'Aloha.server.channelUtilization:last']].head()
```

<div class="output-prompt">Out[24]:</div>




<div class="output-html">
<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th>qname</th>
      <th>numHosts</th>
      <th>iaMean</th>
      <th>Aloha.server.channelUtilization:last</th>
    </tr>
    <tr>
      <th>run</th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>PureAlohaExperiment-0-20170627-20:42:16-22739</th>
      <td>10.0</td>
      <td>1.0</td>
      <td>0.156057</td>
    </tr>
    <tr>
      <th>PureAlohaExperiment-1-20170627-20:42:17-22739</th>
      <td>10.0</td>
      <td>1.0</td>
      <td>0.156176</td>
    </tr>
    <tr>
      <th>PureAlohaExperiment-10-20170627-20:42:16-22741</th>
      <td>10.0</td>
      <td>7.0</td>
      <td>0.109571</td>
    </tr>
    <tr>
      <th>PureAlohaExperiment-11-20170627-20:42:16-22741</th>
      <td>10.0</td>
      <td>7.0</td>
      <td>0.108992</td>
    </tr>
    <tr>
      <th>PureAlohaExperiment-12-20170627-20:42:16-22741</th>
      <td>10.0</td>
      <td>9.0</td>
      <td>0.090485</td>
    </tr>
  </tbody>
</table>
</div>
</div>




Since we have our *x* and *y* data in separate columns now, we can utilize the
scatter plot feature of the data frame for plotting it:

<div class="input-prompt">In[25]:</div>

```python
# set the default image resolution and size
plt.rcParams['figure.figsize'] = [8.0, 3.0]
plt.rcParams['figure.dpi'] = 144
# create a scatter plot
scalars_wide.plot.scatter('iaMean', 'Aloha.server.channelUtilization:last')
plt.show()
```

<div class="output-prompt">Out[25]:</div>


![png](data:image/png;base64,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)



NOTE: Although `plt.show()` is not needed in Jupyter (`%matplotlib inline`
turns on immediate display), we'll continue to include it in further code
fragments, so that they work without change when you use another Python shell.

The resulting chart looks quite good as the first attempt. However, it has some
shortcomings:

- Dots are not connected. The dots that have the same `numHosts` value should
  be connected with iso lines.
- As the result of having two simulation runs for each *(iaMean,numHosts)* pair,
  the dots appear in pairs. We'd like to see their averages instead.

Unfortunately, scatter plot can only take us this far, we need to look for
another way.

What we really need as chart input is a table where rows correspond to different
`iaMean` values, columns correspond to different `numHosts` values, and cells
contain channel utilization values (the average of the repetitions).
Such table can be produced from the "wide format" with another pivoting
operation. We use `pivot_table()`, a cousin of the `pivot()` method we've seen above.
The difference between them is that `pivot()` is a reshaping operation (it just
rearranges elements), while `pivot_table()` is more of a spreadsheet-style
pivot table creation operation, and primarily intended for numerical data.
`pivot_table()` accepts an aggregation function with the default being *mean*,
which is quite convenient for us now (we want to average channel utilization
over repetitions.)

<div class="input-prompt">In[26]:</div>

```python
aloha_pivot = scalars_wide.pivot_table(index='iaMean', columns='numHosts', values='Aloha.server.channelUtilization:last')  # note: aggregation function = mean (that's the default)
aloha_pivot.head()
```

<div class="output-prompt">Out[26]:</div>




<div class="output-html">
<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th>numHosts</th>
      <th>10.0</th>
      <th>15.0</th>
      <th>20.0</th>
    </tr>
    <tr>
      <th>iaMean</th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>1.0</th>
      <td>0.156116</td>
      <td>0.089539</td>
      <td>0.046586</td>
    </tr>
    <tr>
      <th>2.0</th>
      <td>0.194817</td>
      <td>0.178159</td>
      <td>0.147564</td>
    </tr>
    <tr>
      <th>3.0</th>
      <td>0.176321</td>
      <td>0.191571</td>
      <td>0.183976</td>
    </tr>
    <tr>
      <th>4.0</th>
      <td>0.153569</td>
      <td>0.182324</td>
      <td>0.190452</td>
    </tr>
    <tr>
      <th>5.0</th>
      <td>0.136997</td>
      <td>0.168780</td>
      <td>0.183742</td>
    </tr>
  </tbody>
</table>
</div>
</div>




Note that rows correspond to various `iaMean` values (`iaMean` serves as index);
there is one column for each value of `numHosts`; and that data in the table
are the averages of the channel utilizations produced by the simulations
performed with the respective `iaMean` and `numHosts` values.

For the plot, every column should generate a separate line (with the *x* values
coming from the index column, `iaMean`) labelled with the column name.
The basic Matplotlib interface cannot create such plot in one step. However,
the Pandas data frame itself has a plotting interface which knows how to
interpret the data, and produces the correct plot without much convincing:

<div class="input-prompt">In[27]:</div>

```python
aloha_pivot.plot.line()
plt.ylabel('channel utilization')
plt.show()
```

<div class="output-prompt">Out[27]:</div>


![png](data:image/png;base64,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qbL+s/E/fL3va0C9+yIictyECRNo2rQpbdq0Yd68efTv37/Ee7p27cq4cePK1G56ejo333wzNWvWZO7cufTo0QOABx54gAEDBjB16lQmT558SqMGRERETkWVHNIvUnDu/vUdrue0uNMiGJGIiFQW/fv3p23btpgVOaOv3EydOpVdu3YxbNiw3GQfIC4ujgcffBCASZMmFXe7iIhI2KmHX6qk9ze+n9u7nxCToJX5RUSkTLZt28azzz7Lnj17aNiwIRdeeCFdunQ5qTrmzJkDwMCBAwud69OnDwkJCSxcuJCjR48SGxsblrhFRERORAm/VDnZns0zK57JfX19inr3RUSkbN5//33ef//9fGX9+vXjlVdeoXnz5qWqY82aYIvYdu3aFToXExNDq1at+PLLL0lLSyMlJaXsQYuIiJRACb9UObM2zMrfu99RvfsiIiUaVz/SEZTeuP0V1lRCQgL33nsvgwcPpnXr1gCsXLmScePG8cEHH3DxxRezfPly6tSpU2Jd+/cHcdevX/SfdU75vn37whO8iIhICTSHX6qUrOysfL37N6TcQIO4BpELSEREqrRGjRoxfvx4unXrRoMGDWjQoAF9+vRh1qxZnH/++Xz99de88MILkQ5TRETklCjhlypl1sZZfLP/GwDq1KqjufsiIlIuYmJiuOmmmwCYP39+qe7J6cHP6ekvKKe8QYMGZQ9QRESkFDSkX6qMonr368dWoSGqIiKRVIHD5KPF6aefDsChQ4dKdX379u1ZsmQJa9eupXv37vnOZWZmsn79emJiYnKnDoiIiJQ39fBLlfHehvdI258GQN1adfmvjv8V4YhERCSaffLJJwClTtAHDBgAwLvvvlvo3Pz588nIyKBnz55aoV9ERCqMEn6pErKys3hmpXr3RUQkvJYtW0Z2dnah8tmzZzNhwgQAhg8fnu/c/v37Wb16Nd9++22+8tTUVJKTk5k8eTJLlizJLT9y5Aj33HMPALfeemu434KIiEixNKRfqoR3N7zL+v3rgaB3f0THERGOSEREKqvp06czffp0ALZv3w7Axx9/zMiRIwFITk7mscceA+DOO+9k3bp19OzZk6ZNmwLBKv1z5swB4IEHHqBnz5756n/99dcZNWoUN954Iy+//HJueWJiIs8//zypqan069ePYcOGkZSUxMyZM1mzZg2pqakMHTq0HN+5iIhI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M6mc9LlUPvpMKh99JpWTPpfKR59J5aTPpfKJ9s9Ec/hFREREREREopASfhEREREREZEopIRfREREREREJAop4RcRERERERGJQkr4RURERERERKKQVukXERERERERiULq4RcRERERERGJQkr4RURERERERKKQEn4RERERERGRKKSEX0RERERERCQKKeEXERERERERiUJK+EVERERERESikBJ+ERERERERkSikhF/CzsxSzewpM/vQzNLNzM3s75GOqzozs4ZmdpOZvW5mX5vZYTPbb2YfmdnPzUz/FkSImT1iZrPNbHPoc9lrZp+Z2Vgzaxjp+CRgZsND/5a5md0U6XiqIzPbkOczKPizPdLxVWdmdnHo/5ftZnbUzLaZ2XtmNijSsVU3ZjbyBH9Pcn6yIh1ndWRml5nZLDPbEvr/Ps3MppjZhZGOrTqywM1mtsjMDprZITNbYma3RNv34phIByBR6R7gB8BBYAvQIbLhCHANMAn4FvgA2AScAVwNvAD8xMyucXePXIjV1mhgGfA+sBOoA1wAjAN+YWYXuPvmyIUnZtYMeJrg37S6EQ6nutsPTCyi/GAFxyEhZvYocDfB//czgd3A6UB3oB/wdsSCq56WA/cXc643MAB4p8KiESB4uA/8f8AeYDrB35M2wJXAEDP7L3dX51jF+jtwPcF3r38CGcCPCb4v9wT+K3KhhZfp+72Em5n1J/iP/2ugL0GC+f/cfXhEA6vGzGwAQSL5lrtn5ylvDHwKNANS3X1ahEKstswszt2PFFH+EPAHYJK7/6riIxMIegAIHsa0Al4D/hu42d1fiGhg1ZCZbQBw95aRjURymNnNwHPAK8Av3P37AudrufuxiAQnhZjZxwQPlK9095mRjqe6CH3X2grsArq4+8485/oDc4D17t46QiFWO2Z2FcH/6euB89x9d6i8NjAN+CkwxN1fi1yU4RNVwxWkcnD3D9x9nXqLKw93n+Pub+RN9kPl24FnQi/7VXhgQlHJfsi/Q8e2FRWLFOl2gh6xUcChCMciUmmYWSzwEMGIsULJPoCS/crDzM4hSPa3Am9FOJzqpgVBzrUob7IPwXdm4ADBqBipOFeFjv+Xk+wDhP4duzf08jcVHlU50ZB+Ecn5QpYZ0SikoMtDx5URjaIaM7MU4GHgCXefHxopI5EVa2bDgeYED2BWAvPdXXOSK96PCZKU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)



## 8. Interactive pivot tables


Getting the pivot table right is not always easy, so having a GUI where
one can drag columns around and immediately see the result is definitely
a blessing. Pivottable.js presents such a GUI inside a browser, and
although the bulk of the code is Javascript, it has a Python frond-end
that integrates nicely with Jupyter. Let's try it!

<div class="input-prompt">In[28]:</div>

```python
import pivottablejs as pj
pj.pivot_ui(scalars_wide)
```

<div class="output-prompt">Out[28]:</div>




<div class="output-html">

        <iframe
            width="100%"
            height="500"
            src="pivottablejs.html"
            frameborder="0"
            allowfullscreen
        ></iframe>

</div>




An interactive panel containing the pivot table will appear. Here is how
you can reproduce the above "Channel utilization vs iaMean" plot in it:

1. Drag `numHosts` to the "rows" area of the pivot table.
   The table itself is the area on the left that initially only displays "Totals | 42",
   and the "rows" area is the empty rectangle directly of left it.
   The table should show have two columns (*numHosts* and *Totals*) and
   five rows in total after dragging.
2. Drag `iaMean` to the "columns" area (above the table). Columns for each value
   of `iaMean` should appear in the table.
3. Near the top-left corner of the table, select *Average* from the combo box
   that originally displays *Count*, and select `ChannelUtilization:last`
   from the combo box that appears below it.
4. In the top-left corner of the panel, select *Line Chart* from the combo box
   that originally displays *Table*.

If you can't get to see it, the following command will programmatically
configure the pivot table in the appropriate way:

<div class="input-prompt">In[29]:</div>

```python
pj.pivot_ui(scalars_wide, rows=['numHosts'], cols=['iaMean'], vals=['Aloha.server.channelUtilization:last'], aggregatorName='Average', rendererName='Line Chart')
```

<div class="output-prompt">Out[29]:</div>




<div class="output-html">

        <iframe
            width="100%"
            height="500"
            src="pivottablejs.html"
            frameborder="0"
            allowfullscreen
        ></iframe>

</div>




If you want experiment with Excel's or LibreOffice's built-in pivot table
functionality, the data frame's `to_clipboard()` and `to_csv()` methods
will help you transfer the data. For example, you can issue the
`scalars_wide.to_clipboard()` command to put the data on the clipboard, then
paste it into the spreadsheet. Alternatively, type `print(scalars_wide.to_csv())`
to print the data in CSV format that you can select and then copy/paste.
Or, use `scalars_wide.to_csv("scalars.csv")` to save the data into a file
which you can import.


## 9. Plotting histograms


In this section we explore how to plot histograms recorded by the simulation.
Histograms are in rows that have `"histogram"` in the `type` column.
Histogram bin edges and bin values (counts) are in the `binedges` and
`binvalues` columns as NumPy array objects (`ndarray`).

Let us begin by selecting the histograms into a new data frame for convenience.

<div class="input-prompt">In[30]:</div>

```python
histograms = aloha[aloha.type=='histogram']
len(histograms)
```

<div class="output-prompt">Out[30]:</div>




    84




We have 84 histograms. It makes no sense to plot so many histograms on one chart,
so let's just take one on them, and examine its content.

<div class="input-prompt">In[31]:</div>

```python
hist = histograms.iloc[0]  # the first histogram
hist.binedges, hist.binvalues
```

<div class="output-prompt">Out[31]:</div>




    (array([-0.11602833, -0.08732314, -0.05861794, -0.02991275, -0.00120756,
             0.02749763,  0.05620283,  0.08490802,  0.11361321,  0.1423184 ,
             0.1710236 ,  0.19972879,  0.22843398,  0.25713917,  0.28584437,
             0.31454956,  0.34325475,  0.37195994,  0.40066514,  0.42937033,
             0.45807552,  0.48678071,  0.51548591,  0.5441911 ,  0.57289629,
             0.60160148,  0.63030668,  0.65901187,  0.68771706,  0.71642225,
             0.74512745]),
     array([   0.,    0.,    0.,    0.,    0.,    0.,    0., 1234., 2372.,
            2180., 2115., 1212.,  917.,  663.,  473.,  353.,  251.,  186.,
             123.,   99.,   60.,   44.,   31.,   25.,   15.,   13.,    9.,
               3.,    5.,    3.]))




The easiest way to plot the histogram from these two arrays is to look at it
as a step function, and create a line plot with the appropriate drawing style.
The only caveat is that we need to add an extra `0` element to draw the right
side of the last histogram bin.

<div class="input-prompt">In[32]:</div>

```python
plt.plot(hist.binedges, np.append(hist.binvalues, 0), drawstyle='steps-post')   # or maybe steps-mid, for integers
plt.show()
```

<div class="output-prompt">Out[32]:</div>


![png](data:image/png;base64,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)



Another way to plot a recorded histogram is Matplotlib's `hist()` method,
although that is a bit tricky. Instead of taking histogram data, `hist()`
insists on computing the histogram itself from an array of values -- but we only
have the histogram, and not the data it was originally computed from.
Fortunately, `hist()` can accept a bin edges array, and another array as weights
for the values. Thus, we can trick it into doing what we want by passing
in our `binedges` array twice, once as bin edges and once as values, and
specifying `binvalues` as weights.

<div class="input-prompt">In[33]:</div>

```python
plt.hist(bins=hist.binedges, x=hist.binedges[:-1], weights=hist.binvalues)
plt.show()
```

<div class="output-prompt">Out[33]:</div>


![png](data:image/png;base64,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)



`hist()` has some interesting options. For example, we can change the plotting
style to be similar to a line plot by setting `histtype='step'`. To plot the
normalized version of the histogram, specify `density=True`.
To draw the cumulative density function, also specify `cumulative=True`.
The following plot shows the effect of some of these options.

<div class="input-prompt">In[34]:</div>

```python
plt.hist(bins=hist.binedges, x=hist.binedges[:-1], weights=hist.binvalues, histtype='step', density=True)
plt.show()
```

<div class="output-prompt">Out[34]:</div>


![png](data:image/png;base64,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)



To plot several histograms, we can iterate over the histograms and draw them
one by one on the same plot. The following code does that, and also adds a
legend and adjusts the bounds of the x axis.

<div class="input-prompt">In[35]:</div>

```python
somehistograms = histograms[histograms.name == 'collisionLength:histogram'][:5]
for row in somehistograms.itertuples():
    plt.plot(row.binedges, np.append(row.binvalues, 0), drawstyle='steps-post')
plt.legend(somehistograms.module + "." + somehistograms.name)
plt.xlim(0, 0.5)
plt.show()
```

<div class="output-prompt">Out[35]:</div>


![png](data:image/png;base64,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PRSgDh48aAiLiIhQgOrXr5+6ceOGUXz9ezFjxgyjcEABatiwYSorK6uI1sgTGxurANWwYUOVmppqcvzcuXOG3xcvXqwA5eXlpf78809D+LVr15SPj48C1KJFi0zK4+fnZ7bs+fuRubgHDx5UgOrbt69JuXJyclRaWprh38nJyQpQwcHBRvECAgIUoMLCwozCf/75Z2VhYaFcXFyM6qJvcwsLC7Vp0yajNBMnTlSAmjZtmtn6hISEmJQzv6ysLOXu7q6sra1VfHy80bHffvtN1alTR9WqVUv9/fffJnnb29sb9Q2llBoyZIgC1LJly4zapXHjxgpQMTExRvG/+uorQ/8oru3z07ctoEJDQ42OrV+/XgGqe/fuJukaNGigAJWcnGwUrr9OXF1d1ZkzZ4zap3379gpQu3btMsmrQYMGhn+X5lourn6JiYmG8uT/3MnKylI9e/ZUgJo6daoh/I8//lBOTk7KyspKHThwwCivt956y9BW+eudvw3ffvtts+VISUkxW5f58+crQH300UdG4fn7av7+lJOTo/z9/RWgnJ2d1cKFC43SjRo1SgFq5cqVZsthTnH/b+p5e3srYK/6h8ead+XrBk3TBmqaNkvTtO2apv2haZrSNG1hIXHdbh8v7LW0iPMEa5q2W9O0a5qmZWqaFq9pmunXhf+Lb6Fp2r81TTuoadpfmqalaZoWo2ma792otxBCCCEqHqXyNpHT6XQMHz7cED5ixAjDpnLFWbhwIbdu3eLVV1+lSZMmRsemTp2Kvb0933//vdnpo9OmTcPFxcXwb1tbW4KCgsjNzeWXX34ximtufapOp2PcuHFA3jTU4ug3y7O2tjZ7J6lq1aqG37/77jsyMjKYMmUKjz32mFG8Zs2a8fzzz7N//34OHz5sks+ECRNo2LChSXhwcDAACxYsMAq/ePEisbGxeHl50bx5c0P4559/jqWlJd9++y2VK1c2SvPuu+9StWpVs3ewraysmD59usmddnNmzZoFwKeffkrdunVNjterV8/w+7fffgvARx99hJ2dnSHc1taWadOmATB//vxiz1laBesOee+9s7NzkelSU1PZsGED9evXZ8KECUbHfH19GTJkCGlpaaxYscIk7eDBg+nSpYtR2AsvvADA7t27S1sFANauXcupU6d47bXX8PPzMzpWp04dJkyYwMWLF81unDZ27FijvgF5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)



Note, however, that the legend contains the same string for all histograms,
which is not very meaningful. We could improve that by including some
characteristics of the simulation that generated them, i.e. the number of hosts
(`numHosts` iteration variable) and frame interarrival times (`iaTime` iteration
variable). We'll see in the next section how that can be achieved.


## 10. Adding iteration variables as columns


In this step, we add the iteration variables associated with the simulation
run to the data frame as columns. There are several reasons why this is a
good idea: they are very useful for generating the legends for plots of
e.g. histograms and vectors (e.g. "collision multiplicity histogram for
numHosts=20 and iaMean=2s"), and often needed as chart input as well.

First, we select the iteration variables vars as a smaller data frame.

<div class="input-prompt">In[36]:</div>

```python
itervars_df = aloha.loc[aloha.type=='itervar', ['run', 'attrname', 'attrvalue']]
itervars_df.head()
```

<div class="output-prompt">Out[36]:</div>




<div class="output-html">
<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>run</th>
      <th>attrname</th>
      <th>attrvalue</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>14</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>iaMean</td>
      <td>3</td>
    </tr>
    <tr>
      <th>15</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>numHosts</td>
      <td>10</td>
    </tr>
    <tr>
      <th>42</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
      <td>iaMean</td>
      <td>2</td>
    </tr>
    <tr>
      <th>43</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
      <td>numHosts</td>
      <td>10</td>
    </tr>
    <tr>
      <th>70</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>iaMean</td>
      <td>1</td>
    </tr>
  </tbody>
</table>
</div>
</div>




We reshape the result by using the `pivot()` method. The following statement
will convert unique values in the `attrname` column into separate columns:
`iaMean` and `numHosts`. The new data frame will be indexed with the run id.

<div class="input-prompt">In[37]:</div>

```python
itervarspivot_df = itervars_df.pivot(index='run', columns='attrname', values='attrvalue')
itervarspivot_df.head()
```

<div class="output-prompt">Out[37]:</div>




<div class="output-html">
<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th>attrname</th>
      <th>iaMean</th>
      <th>numHosts</th>
    </tr>
    <tr>
      <th>run</th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>PureAlohaExperiment-0-20170627-20:42:16-22739</th>
      <td>1</td>
      <td>10</td>
    </tr>
    <tr>
      <th>PureAlohaExperiment-1-20170627-20:42:17-22739</th>
      <td>1</td>
      <td>10</td>
    </tr>
    <tr>
      <th>PureAlohaExperiment-10-20170627-20:42:16-22741</th>
      <td>7</td>
      <td>10</td>
    </tr>
    <tr>
      <th>PureAlohaExperiment-11-20170627-20:42:16-22741</th>
      <td>7</td>
      <td>10</td>
    </tr>
    <tr>
      <th>PureAlohaExperiment-12-20170627-20:42:16-22741</th>
      <td>9</td>
      <td>10</td>
    </tr>
  </tbody>
</table>
</div>
</div>




Now, we only need to add the new columns back into the original dataframe, using
`merge()`. This operation is not quite unlike an SQL join of two tables on the
`run` column.

<div class="input-prompt">In[38]:</div>

```python
aloha2 = aloha.merge(itervarspivot_df, left_on='run', right_index=True, how='outer')
aloha2.head()
```

<div class="output-prompt">Out[38]:</div>




<div class="output-html">
<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>run</th>
      <th>type</th>
      <th>module</th>
      <th>name</th>
      <th>attrname</th>
      <th>attrvalue</th>
      <th>value</th>
      <th>count</th>
      <th>sumweights</th>
      <th>mean</th>
      <th>stddev</th>
      <th>min</th>
      <th>max</th>
      <th>binedges</th>
      <th>binvalues</th>
      <th>vectime</th>
      <th>vecvalue</th>
      <th>iaMean</th>
      <th>numHosts</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>configname</td>
      <td>PureAlohaExperiment</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>3</td>
      <td>10</td>
    </tr>
    <tr>
      <th>1</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>datetime</td>
      <td>20170627-20:42:20</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>3</td>
      <td>10</td>
    </tr>
    <tr>
      <th>2</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>experiment</td>
      <td>PureAlohaExperiment</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>3</td>
      <td>10</td>
    </tr>
    <tr>
      <th>3</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>inifile</td>
      <td>omnetpp.ini</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>3</td>
      <td>10</td>
    </tr>
    <tr>
      <th>4</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>iterationvars</td>
      <td>numHosts=10, iaMean=3</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>3</td>
      <td>10</td>
    </tr>
  </tbody>
</table>
</div>
</div>




For plot legends, it is also useful to have a single `iterationvars` column with
string values like `numHosts=10, iaMean=2`. This is easier than the above: we
can just select the rows containing the run attribute named `iterationvars`
(it contains exactly the string we need), take only the `run` and `attrvalue`
columns, rename the `attrvalue` column to `iterationvars`, and then merge back the
result into the original data frame in a way we did above.

The selection and renaming step can be done as follows. (Note: we need
`.astype(str)` in the condition so that rows where `attrname` is not filled in
do not cause trouble.)

<div class="input-prompt">In[39]:</div>

```python
itervarscol_df = aloha.loc[(aloha.type=='runattr') & (aloha.attrname.astype(str)=='iterationvars'), ['run', 'attrvalue']]
itervarscol_df = itervarscol_df.rename(columns={'attrvalue': 'iterationvars'})
itervarscol_df.head()
```

<div class="output-prompt">Out[39]:</div>




<div class="output-html">
<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>run</th>
      <th>iterationvars</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>4</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>numHosts=10, iaMean=3</td>
    </tr>
    <tr>
      <th>32</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
      <td>numHosts=10, iaMean=2</td>
    </tr>
    <tr>
      <th>60</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>numHosts=10, iaMean=1</td>
    </tr>
    <tr>
      <th>88</th>
      <td>PureAlohaExperiment-1-20170627-20:42:17-22739</td>
      <td>numHosts=10, iaMean=1</td>
    </tr>
    <tr>
      <th>116</th>
      <td>PureAlohaExperiment-2-20170627-20:42:19-22739</td>
      <td>numHosts=10, iaMean=2</td>
    </tr>
  </tbody>
</table>
</div>
</div>




In the merging step, we join the two tables (I mean, data frames) on the `run`
column:

<div class="input-prompt">In[40]:</div>

```python
aloha3 = aloha2.merge(itervarscol_df, left_on='run', right_on='run', how='outer')
aloha3.head()
```

<div class="output-prompt">Out[40]:</div>




<div class="output-html">
<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>run</th>
      <th>type</th>
      <th>module</th>
      <th>name</th>
      <th>attrname</th>
      <th>attrvalue</th>
      <th>value</th>
      <th>count</th>
      <th>sumweights</th>
      <th>mean</th>
      <th>stddev</th>
      <th>min</th>
      <th>max</th>
      <th>binedges</th>
      <th>binvalues</th>
      <th>vectime</th>
      <th>vecvalue</th>
      <th>iaMean</th>
      <th>numHosts</th>
      <th>iterationvars</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>configname</td>
      <td>PureAlohaExperiment</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>3</td>
      <td>10</td>
      <td>numHosts=10, iaMean=3</td>
    </tr>
    <tr>
      <th>1</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>datetime</td>
      <td>20170627-20:42:20</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>3</td>
      <td>10</td>
      <td>numHosts=10, iaMean=3</td>
    </tr>
    <tr>
      <th>2</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>experiment</td>
      <td>PureAlohaExperiment</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>3</td>
      <td>10</td>
      <td>numHosts=10, iaMean=3</td>
    </tr>
    <tr>
      <th>3</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>inifile</td>
      <td>omnetpp.ini</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>3</td>
      <td>10</td>
      <td>numHosts=10, iaMean=3</td>
    </tr>
    <tr>
      <th>4</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>iterationvars</td>
      <td>numHosts=10, iaMean=3</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>None</td>
      <td>3</td>
      <td>10</td>
      <td>numHosts=10, iaMean=3</td>
    </tr>
  </tbody>
</table>
</div>
</div>




To see the result of our work, let's try plotting the same histograms again,
this time with a proper legend:

<div class="input-prompt">In[41]:</div>

```python
histograms = aloha3[aloha3.type=='histogram']
somehistograms = histograms[histograms.name == 'collisionLength:histogram'][:5]
for row in somehistograms.itertuples():
    plt.plot(row.binedges, np.append(row.binvalues, 0), drawstyle='steps-post')
plt.title('collisionLength:histogram')
plt.legend(somehistograms.iterationvars)
plt.xlim(0, 0.5)
plt.show()
```

<div class="output-prompt">Out[41]:</div>


![png](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA+oAAAGiCAYAAABwCjz6AAAAOXRFWHRTb2Z0d2FyZQBNYXRwbG90bGliIHZlcnNpb24zLjMuMiwgaHR0cHM6Ly9tYXRwbG90bGliLm9yZy8vihELAAAACXBIWXMAABYlAAAWJQFJUiTwAACUcElEQVR4nOzdeXzNZ97/8dcVkZCokKaWIoKWqurEMtz2TIZWtcrc0lVbS8fNz6hS9NZFRbm1hhm06WpN27FVqxHTVrUVSnWG0FtvTKsqyFhaokFSCXL9/jhLk5yTCDmcI97Px+M8Ts73Wr7X95yT8Plem7HWIiIiIiIiIiKBIcjfDRARERERERGRXylQFxEREREREQkgCtRFREREREREAogCdREREREREZEAokBdREREREREJIAoUBcREREREREJIArURURERERERAKIAnURERERERGRAKJAXURERERERCSAKFAXERERERERCSAK1EVEREREREQCiAJ1ERERERERkQCiQF1EREREREQkgChQFxGRi2aMSTPGWGPMwGLHY5zHrZcyic60hT44/0BnXWnlrUt871J+PsaYOGfdGRdZ3jofMb5tmYiISPkpUBcREfGhQjcvFvq7LZeSMwhPNMbE+rst/maMGeV8L2L83RYREakYgv3dABERueocBb4FDvmgrmxnXft9UJdcmIFANyAD+NqfDblI3zqfz/igrlFAQyANx/shIiJSLgrURUTksrLWJgFJPqprBbDCF3XJ1cVae5O/2yAiIlISDX0XERERERERCSAK1EVEKihjTHNjzOvGmO+MMbnGmJ+NMd8YY14yxrTxkr+VMeYdY8wBY0yeMeaoMWa1Maafj9tV4mJyxphrjDETjDHpxpiTxph8Y8xBY8wWY8x0Y8wtxfKfd7EyY8x/GmM+Nsb85LyuTGPM34wxrUvIX2QhPGPMLcaYJcaYw8aY08aYfznbGFK+d8LruTs7z5XpbOsxY8ynxpgHjDHGS/4iC6oZYzoZY1Y5P7tfjDH/a4wZ4a1soTpqGmNmGmMynOc8YIyZa4xp4G3BNtd7jmPYO8CCQguzlbq4mzGmtzFmrfO7eMoY85Ux5oGLfLuK131B117aYnLGmG7GmOXOzyHfGJNtjNltjPnAGDPUGBPkzJfofC8aOouuLfZepHmpu4kx5g1jzA/O79NxY8x6Y8wfjTGV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sYM33niDF154gffff5/PPvuMypUrM27cOA4dOuTvZvqEetRF5JJL3pHMq1+/Su7ZXK/pywr93DK55eVpVDmEBYcxPHY4A1oM8HdTRESkBBkZGTRq1IgBAwaQmJjI+PHj+fTTTzl16hS33HILiYmJ3HXXXUXKJCYmMmnSJNauXUtcXFyJ9S1cuNB9fODAgSQnJ/PDDz/w97//nVdffZUffviBOnXq8F//9V889dRTGGN49913mT59Ojt27CA8PJx7772X6dOnU7VqVZ9ed3p6OlOnTuWLL74gOzubOnXqcOeddzJhwgTq1q1bJO+RI0eYPn06qampZGZmUrlyZWrXrk2HDh147rnnaNy4sfv6ACZNmsSkSZPc5V3vU35+Pq+//joLFy5k79695OXlUatWLX7zm9/w2GOP0b17d59eY8+ePS8o//z588nLy+O///u/i8whr1mzJk8//TSPPvoor7/+Oh06dChXu1x1F562kJ2dzZtvvslHH33Ed999x48//khERAQdOnTgqaeeKvWcQ4YM4YMPPuDtt99m1KhRRdLmzJlDgwYN6NmzJytWrPBaPjc3l9mzZ7N06VJ2796NMYaWLVsycuRIHnjggSJ58/PzefPNN/nwww/ZsWMHhw8fJjw8nNatWzNmzBjuuOOOEq93x44dJCYmsnTpUo4cOUKDBg0YMmQITz75JF627S6XgQMHej3erVs34uLiWLNmDV9++SX9+vXz6Xn9QYG6iFxypQXpV6Lcs7m8+vWrCtRFRK4A+/bto127djRu3JiHH36YrKwsli5dSp8+ffj000/53e9+55PzjB07lrS0NHr37s1tt93GypUreeaZZ8jPzycyMpLx48fTt29funTpwpo1a3jllVc4d+4cr732mk/OD4452P369cNaS0JCAg0bNiQ9PZ3XXnuNlJQUNmzYQKNGjp2Vc3Nz6dSpE3v27KFHjx707t0bay379u0jJSWFhIQEGjduTN++fQFITk52B0MurkBt4MCBLF68mFtuuYVHHnmEqlWrcvDgQTZs2MDHH3/s80D9QrnmeXsL8F0BaGlzwctj165dPPPMM3Tt2pU777yTmjVrsn//flauXMlHH31EampqiTceevToQUxMDHPnzi0SqKenp7Nt2zYmTpxIUJD3AdI///wz8fHxbNu2jdatWzN48GAKCgpYvXo1Dz74IDt27GDKlCnu/FlZWTz++ON07NiRHj16cN1113Ho0CFSU1Pp1asXc+bM4Y9//KPHec6cOcPtt9/OwYMHueOOOwgODuaDDz5g/PjxnD59mokTJ5bvDbwAlStXBhxTBiqCinEVIhLQKlKQ7lIRr0lErhKJEf5uQdklZpe7irS0NBITE4sEDA8++CA9e/Zk+vTpPgvU09PT2b59O/Xq1QMcvfM33HAD06dPJywsjPT0dJo3bw5AXl4erVq1Yv78+UyaNIlatWp51Ddr1ixq1Kjh9VzeFpo7deoUAwYM4OzZs6SlpdGlSxd32rRp0xg/fjxDhw7lk08+ARzzqffs2cOoUaOYObPoTsb5+fnk5eUB0LdvX2rUqEFycjJxcXEei5ZlZ2ezZMkS2rRpwz/+8Q8qVapUJL34sO2FCxeWulBecTExMSX2opbVt99+C0DTpk090urWrUt4eDiZmZnk5uYSFhZWrnMV17x5cw4ePEhUVFSR45mZmbRr147Ro0eXGKgbY3j00UeZMGECmzZtcve+z5kzh6CgIAYPHuz+PIsbNWoU27ZtY9q0aTz55JPu46dPn6Zv375MnTqVhIQEYmNjAcfogn379lG/fv0i9WRnZ9OpUyeefPJJ+vfv7zEC5ODBg/zmN79hzZo17rSJEyfStGlTZs6cydNPP+0OoMHxvf7555/P/8Y5xcbGum8WlWbfvn189tlnhIWF0bVr1zLXH8gUqIvIZfXNgG88ju16oXmp6YHkShiaLyIiv2rYsKHHPObbb7+d6Oho/vnPf/rsPBMmTHAH6QA1atTg7rvvZsGCBYwZM8YdpAOEhoZy3333kZiYyK5du7wG6rNnz76g86ekpJCVlcUDDzxQJEgHx+Jrr7/+OmvWrGH//v1ER0e707wNvQ8JCSEkJKRM5zXGYK0lNDTUa+/utddeW+T1woULWbduXZnqBseQ5vIG6tnZjhs+ERHeb1JFRESQk5NDdna2zwP1ks5Zv359EhISePnllz0+k8IGDRpEYmIic+bMoUOHDuTk5LBo0SL3d9ibY8eO8c4779C2bdsiQTpAlSpVmDZtGqtXr2bRokXuQD00NNQjSHe1f/DgwYwZM4bNmzd7DYJfeumlIt+jWrVq0adPH9566y2+/fZbbrnlFnfarFmz2Ldvn9d2ezNgwIDzBup5eXn079+fvLw8/vznP1OzZs0y1x/IFKiLiIiISIUVGxvr0csL0KBBA58sIObStm1bj2PXX389AG3atPFIcwX1mZmZXuvbu3dviXtyx8XFeQS7W7duBfC6QnhwcDBdu3YlIyODbdu2ER0dTbdu3ahXrx4vvvgiW7dupVevXnTq1KnE96sk1atXp3fv3qSmphIbG0u/fv3o0qWLe+u04i7XlnKBZOPGjcyePZtNmzbx448/kp+fXyT93//+d4lBd7169ejVqxfLli1j9uzZLFu2jJMnTzJkyJASz7d582bOnTtX4rZtZ86cARzD8gvbsWMH06dPZ/369Rw6dIjTp097tLO4iIgIbrjhBo/jDRo0AOD48eNFjl/IaIqyOHfuHA8//DAbN27kvvvuY+zYsT6t358UqIuIiIhcTXwwnPxKUtLw8eDgYAoKCnx2Hm89p665sqWluYKm8nL1GhdfMM7Fddw17Lh69ep89dVXTJw4kZUrV7J69WoAoqKiGD58OM8++2yRIculWbp0KdOmTWPRokXuKQZVqlQhISGBGTNmULt27fJcWrlFRERw9OhRsrOzPXr44fw97uWxYsUKEhISqFKlCj169KBJkyaEh4cTFBREWloa69atc08zKMmQIUNITU1l0aJFLFiwgDp16pS62rtrusHmzZvZvHlziflOnTrl/vmrr74iPj6es2fP8vvf/567776b6tWrExQUxNdff01KSorXdpb2+wWOQPpSOXfuHA899BDvvvsu9957L++8847PF6/zJwXqIiIiIiLgHrrtbV/qC5lX6w+uIPPw4cNe011bVhUORuvXr8+8efOw1rJz504+//xzXnnlFZ5//nkKCgqYPHlymc5dtWpVEhMTSUxM5MCBA6xfv56FCxfyzjvvkJGRwRdffOHO64856s2aNePo0aN89913HqusHzp0iJycHOrXr+/zYe/gmBIREhLCli1bikx/ABg6dGiZpgH06tWLevXqMWXKFDIzM3nqqadKXTDN9RmPHj2av/71r2Vq55QpU/jll1+87njwwgsvkJKSUqZ6zsdXc9TPnDlD//79effdd3nwwQd56623LmgkyJVAgbqIiIiICLjnth44cMAjbcuWLZe7ORekVatWgGNo+aOPPlok7ezZs+5guXXr1h5ljTG0aNGCFi1a0LdvX6Kjo/nggw/cgborACpL72iDBg3o378/DzzwAM2aNWPDhg0cO3bM3ZPtjznq8fHxbNy4kY8//tgjUP/oo4/ceS6F77//nhYtWngE6QUFBWzYsKFMdVSqVInBgwczefJkjDFeV18vrF27dgQFBRW5QVKWdkZGRnoE6cAFfV7n44s56vn5+dx7772kpKTwyCOPsGDBghJXv7+SVbwrEhERERG5CO3atQNgwYIFRXrVDxw4wPPPP++vZpVJ3759iYyMZPHixXz11VdF0mbNmsXevXvp3r27ey70jh07OHLkiEc9rmOFe5ddQfb+/fs98v/00098843nQrA5OTmcOnWK4ODgIgvTpaWlYa0t88MXc9oHDRpEaGgoSUlJRXrzjx8/ztSpUwEYNmxYkTIZGRkYY0pcJ6CsYmJi2L17NwcPHnQfs9aSmJjIzp07y1zPyJEjWbFiBatXr6Zx48al5q1Vqxb9+/dny5YtTJ482esNlj179rB3794i7czKymL79u1F8s2bN889LcIXMjIyLujzX7hwYZHyeXl5/OEPfyAlJYVHH320wgbpoB51EREREREA2rdvT9euXVm/fj3t2rUjPj6eI0eOkJqayu233+61pz1QVKtWjfnz53PPPffQrVs37rnnHqKjo0lPT+eTTz6hTp06vPHGG+78a9asYdy4cXTo0IGmTZtSq1YtMjMzSUlJISgoiHHjxrnzNmvWjHr16rFkyRIqV65Mw4YNMcbw8MMPc/z4cVq1akXLli259dZbadCgASdOnGDVqlUcPnyYkSNHcs011/j0WufOnevujf7+++8BSE1NdS/Md9NNNzF+/Hh3/kaNGjF9+nRGjhxJ27Ztue+++wgJCWH58uVkZmYyZswYj5521/oF5d2Te/To0QwbNoxWrVrRr18/KleuzMaNG9m5c6d7Eb6yiIqKKtM2ZS5JSUns3r2b5557jrfffpvOnTtTu3ZtDh48yK5du9i8eTOLFy+mUaNGgGM7t9WrV9O5c2fuvfdeIiIi2LJlCxs2bCAhIYHly5dfzOX73LBhw/jwww+JioqiXr16Xm+gxcXFeR0ZcKVRoC4iIiIi4pSSksK4ceNISUnh5Zdf5sYbb+TPf/4zt912G8uWLfN380rVp08fNm7cyNSpU1m9ejXZ2dnUqVOHYcOGMWHCBPcq9ODYom7//v2sX7+elJQUTpw4Qd26denRowdPPPEEHTt2dOetVKkSK1asYPz48bz77rucPHkSay2dO3cmNjaWSZMmkZaWxtq1azl69CiRkZE0a9aMF198kfvvv9/n17lhwwaSk5OLHNu+fbu7N7hbt25FAnWAxx57jJiYGGbMmMFbb71FQUEBN998M1OmTGHAgAEe53CNEihv+4cOHUpoaCizZs0iOTmZqlWr0qVLFxYsWMB7771X5kD9QlWvXp1169bx5ptvsmjRIt577z1Onz5N7dq1ufHGG5k5cyY9evRw5+/ZsyepqalMmTKFpUuXUqlSJdq1a8fatWv54YcfAiZQd40COHr0aKmjXCpCoG6stf5uwxXLGJPeunXr1unp6f5uikhAK7z3uNd91G/6dd5W83/t8kgPJOe7FvnVlfS5ilQkri2Xis+JFZGye+KJJ3jjjTfYt28fUVFR/m6OXAJl/VvZpk0btm7dutVa67nP4iVUMQf0i4iIiIiIXKR169YxZMgQBeniNxr6LiIiIiIiUohGzIq/qUddREREREREJIAoUBcREREREREJIArURURERERERAKIAnURERERERGRAKJAXURERERERCSAKFAXERERERERCSAK1EVEREREREQCiPZRFxG5SC2TW/q7CeUWFhzG8NjhDGgxwN9NEREREREn9aiLiFyAsOAwfzfBp3LP5vLq16/6uxkiIiIiUogCdRGRCzA8dniFDNZFREREJHBo6LuIyAUY0GJAhRkmXhGG7ouIiIhUROpRFxERERERKaeYmBhiYmL83QypIBSoi4iIiIgEiJiYGIwxZGRklJgnLi4OYwxpaWmXpU1paWkYY0hMTLws5zufefPmMXToUNq3b09YWBjGGJ599tnzllu1ahVxcXFERERQrVo12rdvT3Jy8mVo8YVxfQeMMXz++ecl5hs0aJA7X6B8NpfamTNnmD17NoMGDSI2NpaQkBCMMcydO9ffTfM5DX0XEREREZErxpgxY8jOzqZmzZpcf/317Nmz57xlkpKSeOyxx7j22mt56KGHCAkJYfny5QwcOJBvvvmGGTNmlLtdn332WbnrKCw4OJi5c+cSHx/vkXbixAmWLVtGcHAwZ8+e9el5A1lOTg6jRo0CoHbt2tSpU4cDBw74t1GXiAJ1ERG5JPPVl13i+ovTVnMiIleHJUuW0Lx5cxo2bMjChQsZNGhQqfkzMjIYO3YskZGRbNmyxT08/bnnnuO3v/0tf/nLX+jXrx8dOnQoV7uaNGlS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IiVq2LChxzzm22+/nejoaP75z3/67DwTJkxwB+kANWrU4O6772bBggWMGTPGHaQDhIaGct9995GYmMiuXbu8BuqzZ8++oPOnpKSQlZXFAw88UCRIB8fia6+//jpr1qxh//79REdHu9OKB14AISEhhISElOm8xhistYSGhnrt3b322muLvF64cCHr1q0rU93gGNJc3kA9OzsbgIiICK/pERER5OTkkJ2d7fNAvaRz1q9fn4SEBF5++WWPz6SwQYMGkZiYyJw5c+jQoQM5OTksWrTI/R325tixY7zzzju0bdu2SJAOUKVKFaZNm8bq1atZtGiRO1APDQ31CNJd7R88eDBjxoxh8+bNXoPgl156qcj3qFatWvTp04e33nqLb7/9lltuucWdNmvWLPbt2+e13d4MGDDgvIF6Xl4e/fv3Jy8vjz//+c/UrFmzzPUHMl/1qD+LI0A/BWQCN5WhzP8CH3g5/n/eMhtjZgBjnPXPAUKA+4FUY8xj1tqkYvkNsARIAL4FkoBI4D5gvTGmn7U2pQztFPGLY/MXcDQpiYLcXH83pdyWFfp51wvNS8wnIiLia7GxsR69vAANGjTwyQJiLm3btvU4dv311wPQpk0bjzRXUJ+Zmem1vr1795a4J3dcXJxHsLt161YAryuEBwcH07VrVzIyMti2bRvR0dF069aNevXq8eKLL7J161Z69epFp06dSny/SlK9enV69+5NamoqsbGx9OvXjy5duri3Tivucm0pF0g2btzI7Nmz2bRpEz/++CP5+flF0v/973+XGHTXq1ePXr16sWzZMmbPns2yZcs4efIkQ4YMKfF8mzdv5ty5cyVu23bmzBnAMSy/sB07djB9+nTWr1/PoUOHOH36tEc7i4uIiOCGG27wON6gQQMAjh8/XuT4hYymKItz587x8MMPs3HjRu677z7Gjh3r0/r9yVeB+mgcAfT3OHrWy7KJ3dfW2sSyVG6M6YgjSN8D/NZae9x5fDqQDswwxqyy1mYUKnY/jiD9S+D31trTzjKvAxuAOcaYz621J8vSBpHLraIE6RciyMd3sUVExJMvhpNfSUoaPh4cHExBQYHPzuOt59Q1V7a0NFfQVF6uXuO6det6TXcddw07rl69Ol999RUTJ05k5cqVrF69GoCoqCiGDx/Os88+W2TIcmmWLl3KtGnTWLRokXuKQZUqVUhISGDG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EREREZEAokBdREREREREJIAoUBcREREREREJIArURURERERERAKIAnURERERERGRAKJAXURERERERCSAKFAXERERERERCSAK1EVEREREREQCiAJ1ERERERERkQCiQF1EREREREQkgChQFxEREREREQkgCtRFREREREREAkiwvxsgIp6SdyTTrtDrlskt/dYWERERERG5vNSjLhKAXv36VX834ZIICw7zdxNERERERAKeetRFAlDu2Vx/N8HnwoLDGB473N/NkKuAP0agLLsE53f9zgxoMcAn9YmIiMiVQ4G6yBXgmwHf+LsJIgEtLDiswt3gyj2by6tfv6pAXURE5Cqkoe8iInLFGx47vEJOrahoNx9ERESkbNSjLiIiV7wBLQb4ted51wvN3T/7YgSMFpAUERG5uilQFxER8aFdNzU/f6bzKDznvfBNgEASFBZG1IgRXDt4kL+bIiIiUuEoUBcRn9u2Zj+bV+3lTN45fzelVJVDK/HbuxrRqke0v5siV7igsDAKcq+uYeoFubkcTUpSoC4iInIJaI66iPjclRCkA5zJO8fmVXv93QypAKJGjCAorOLNkT+fq+3mhIiIyOWiHnUR8bkrIUh3uZLaKoHr2sGDfNqzXHiOeiDu+uCL4f0iIiJSMgXqInJJ/en1eH83watXhn3u7yaIiIiIiHiloe8iIiIiIiIiAUSBuoiIiIiIiEgAUaAuIiIiIiIiEkAUqIuIiIiIiIgEEC0mJyJXvUBeWE57vYuIiIhcfdSjLiJXpcqhlfzdhDLRXu8iIiIiVx/1qIvIVem3dzVi86q9V8Q+6mfyzgVsr796/EVERER8T4G6iFyVWvWIDvjg8s3H1wX8jQRXj3+gv5ciIiIiVxINfRcRCVC/vavRFTFEP9BvJoiIiIhcadSjLiISoAK91z9Qh+OLiIiIXOl80qNujEkwxrxsjPnCGHPCGGONMe+cp0xHY8yHxpgsY8wvxpjtxphRxpgSu4+MMXcZY9KMMdnGmFPGmH8YYwac5zwDjDH/dObPdpa/62KvVURERERERORS8tXQ92eBEUAs8O/zZTbG9AHWA12BFUASEALMBJaUUGYEkArcArwDzAGuBxYaY2aUUGYGsBCo68z/DtASSHXWJyIiIiIiIhJQfBWojwaaAtWB/1daRmNMdRxB8zkgzlr7qLV2HI4gfxOQYIy5v1iZGGAGkAW0tdb+yVo7GrgV2AOMMcZ0KFamIzDGmX6rtXa0tfZPQBtnPTOc9YqIiIiIiIgEDJ8E6tbatdba3dZaW4bsCcB1wBJr7ZZCdZzG0TMPnsH+YCAUSLLWZhQqcxyY6nw5rFgZ1+v/ceZzlckAXnHWN6gM7RURERERERG5bPyx6nu88/ljL2nrgVygozEmtIxlPiqWpzxlRERERERERPzKH6u+N3M+f1c8wVp71hizF2gBNAZ2laHMIWNMDlDfGBNmrc01xoQD9YBT1tpDXtqw2/nctCwNNsakl5B0U1nKi4iIiIiIiJSVP3rUI5zP2SWku47XuIgyEcWeL+QcIiIiIiIiIn6nfdTLwFrbxttxZ09768vcHBEREREREanA/NGjXrz3uzjX8Z8vokx2secLOYeIiIiIiIiI3/kjUP/W+ewxP9wYEww0As4CP5SxTF0gHMi01uYCWGtzcOznXs2ZXtyNzmePOe8iIiIiIiIi/uSPoe+fA/2BnsDiYmldgTBgvbU2r1iZTs4ym4qVuaNQnuLnedhZZkEZy4iIryWWNLDlEgupBnHjoeNj/jm/iIiIiMhF8keP+nLgKHC/Maat66AxpgowxfnytWJlFgB5wAhjTEyhMjWBp50vXy9WxvX6GWc+V5kY4E/O+ooH8CJSUeSfgrQX/d0KEREREZEL5pMedWNMX6Cv82Ud53MHY8xC589HrbVjAay1J4wxQ3AE7GnGmCVAFnA3jm3YlgNLC9dvrd1rjBkHvARsMcYsBfKBBKA+8Bdr7aZiZb40xvwVeALYboxZDoQA9wGRwGPW2gxfXL+IBKj8U/5uwVXjlWGBO0CpcmglfntXI1r1iPZ3U0RERETKxFdD32OBAcWONXY+APYBY10J1toPjDHdgGeAfkAV4HscQfVL1lpb/ATW2peNMRnOeh7BMRpgJ/CstTbZW6OstWOMMd/g6EH/L6AA2ApMt9auuqgrFZELk1jSLomX8px+Gm5/lakcWokzeef83YzzOpN3js2r9ipQFxERkSuGTwJ1a20ikHiBZTYCvS6wTCqQeoFlFgILL6SMiIic32/vasTmVXuvmGD9StUyuaW/m+BhWaGfy9K+sOAwhscOZ0CL4vf0RURExBvtoy4iIhelVY/ogO+lDuQh+aUJCw4j92yuv5vhM7lnc3n161cVqIuIiJSRPxaTExERkVIMjx1OWHCYv5vhUxXpxoOIiMilph51EZFL4cuXHavO+3NBO21Rd8Ua0GJAQPc+73qhufvnbwZ8U2reQBy6LyIiEugUqItIxXY1Lyzn2qJOgbqIiIjIFUVD30Wk4gmp5u8WBA5tUSciIiJyxVGPuohUPHHj/T/sHPw79PxqHkkgIiIicoVToC4iFU/HxzTcW0RERESuWArURURE5KLtuql5qemF91wvvAjdlSQoLIyoESO4dvAgfzdFRESuEgrURUQqOn8Ng9eq8xVWUFgYBblXz3ZrBbm5HE1KUqAuIiKXjRaTExGpiAJhQT3XqvNS4USNGEFQWMXa5/18rqYbEyIi4n/qURcRqYgCZUE9f59fLolrBw8qc+9y4X3Uz7fneiA639B+ERGRS0GBuohIReTvBfW06ryIiIjIRdPQdxEREREREZEAokBdREREREREJIAoUBcREREREREJIArURURERERERAKIAnURERERERGRAKJAXURERERERCSAKFAXERERERERCSAK1EVEREREREQCiAJ1ERERERERkQCiQF1EREREREQkgAT7uwEiIlLBJUb457wh1YC3/XNuERERkXJQj7qIiPheSDV/twDyT/m7BSIiIiIXRT3qInJJtXjuY3Lyz/m7GaUKD6nEqO5NGdK1sb+bUnHEjYe0FxUsi4iIiFwEBeoiFdGXL/s5SFrh/inQg3RwtHHWp98pUPeljo85Hv7ir+H2IiIiIj6gQF2kIlJP5gW7Em4oiFzpWia39HcTLtiyQj+3TG5JWHAYw2OHM6DFAL+1SUREKj4F6iJXoG1r9rN51V7O5JUUXAbeAloZL97p7yZ4FTP+715/DjQani9XqrDgMHLP5vq7GT6TezaXV79+VYG6iIhcUlpMTuQKVHqQHjjysf5uwnmFh1TydxPKxDU8X+RKMzx2OGHBYf5uhk9VpBsPIiISmNSjLnIFuhKC9MqhlVhrTvu7Gec1qntTZn363RUx9P1KaKNIcQNaDLiie593vdDc300QEZGrkAJ1kSvcn16P9zxYeCGtxOzL15hipgbwUHKXIV0bB/xw8kAeki8iIiIivqeh7yIiIiIiIiIBRIG6iIiIiIiISADR0HcRkStIIA+D18r0IiIiIr6hHnURkQCnlelFREREri4K1EVEAtyo7k2vqGBdRERERMpHQ99FRAKcVqYXERERubqo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)



## 11. Plotting vectors


This section deals with basic plotting of output vectors. Output vectors
are basically time series data, but values have timestamps instead
of being evenly spaced. Vectors are in rows that have `"vector"`
in the `type` column. The values and their timestamps are in the
`vecvalue` and `vectime` columns as NumPy array objects (`ndarray`).

We'll use a different data set for exploring output vector plotting, one from
the *routing* example simulation. There are pre-recorded result files in the
`samples/resultfiles/routing` directory; change into it in the terminal, and
issue the following command to convert them to CSV:


    scavetool x *.sca *.vec -o routing.csv


Then we read the the CSV file into a data frame in the same way we saw with the
*aloha* dataset:

<div class="input-prompt">In[42]:</div>

```python
routing = pd.read_csv('routing.csv', converters = {
    'attrvalue': parse_if_number,
    'binedges': parse_ndarray,
    'binvalues': parse_ndarray,
    'vectime': parse_ndarray,
    'vecvalue': parse_ndarray})
```

Let us begin by selecting the vectors into a new data frame for convenience.

<div class="input-prompt">In[43]:</div>

```python
vectors = routing[routing.type=='vector']
len(vectors)
```

<div class="output-prompt">Out[43]:</div>




    65




Our data frame contains results from one run. To get some idea what vectors
we have, let's print the list unique vector names and module names:

<div class="input-prompt">In[44]:</div>

```python
vectors.name.unique(), vectors.module.unique()
```

<div class="output-prompt">Out[44]:</div>




    (array(['busy:vector', 'qlen:vector', 'txBytes:vector',
            'endToEndDelay:vector', 'hopCount:vector', 'sourceAddress:vector',
            'rxBytes:vector', 'drop:vector'], dtype=object),
     array(['Net5.rte[0].port$o[0].channel', 'Net5.rte[0].port$o[1].channel',
            'Net5.rte[1].port$o[0].channel', 'Net5.rte[1].port$o[1].channel',
            'Net5.rte[1].port$o[2].channel', 'Net5.rte[2].port$o[0].channel',
            'Net5.rte[2].port$o[1].channel', 'Net5.rte[2].port$o[2].channel',
            'Net5.rte[2].port$o[3].channel', 'Net5.rte[3].port$o[0].channel',
            'Net5.rte[3].port$o[1].channel', 'Net5.rte[3].port$o[2].channel',
            'Net5.rte[4].port$o[0].channel', 'Net5.rte[4].port$o[1].channel',
            'Net5.rte[0].queue[0]', 'Net5.rte[0].queue[1]',
            'Net5.rte[1].queue[0]', 'Net5.rte[1].queue[1]',
            'Net5.rte[1].queue[2]', 'Net5.rte[2].queue[0]',
            'Net5.rte[2].queue[1]', 'Net5.rte[2].queue[2]',
            'Net5.rte[2].queue[3]', 'Net5.rte[3].queue[0]',
            'Net5.rte[3].queue[1]', 'Net5.rte[3].queue[2]',
            'Net5.rte[4].queue[0]', 'Net5.rte[4].queue[1]', 'Net5.rte[4].app',
            'Net5.rte[1].app'], dtype=object))




A vector can be plotted on a line chart by simply passing the `vectime` and
`vecvalue` arrays to `plt.plot()`:

<div class="input-prompt">In[45]:</div>

```python
vec = vectors[vectors.name == 'qlen:vector'].iloc[4]  # take some vector
plt.plot(vec.vectime, vec.vecvalue, drawstyle='steps-post')
plt.xlim(0,100)
plt.show()
```

<div class="output-prompt">Out[45]:</div>


![png](data:image/png;base64,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)



When several vectors need to be placed on the same plot, one can simply
use a `for` loop.

<div class="input-prompt">In[46]:</div>

```python
somevectors = vectors[vectors.name == 'qlen:vector'][:5]
for row in somevectors.itertuples():
    plt.plot(row.vectime, row.vecvalue, drawstyle='steps-post')
plt.title(somevectors.name.values[0])
plt.legend(somevectors.module)
plt.show()
```

<div class="output-prompt">Out[46]:</div>


![png](data:image/png;base64,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EREREZGIpIBWREREREREIpICWhEREREREYlICmhFREREREQkIimgFRERERERkYikgFZEREREREQikgJaERERERERiUiR8B5aEZGId/r0aQ4cOMCRI0c4efIk1tqarpKIRDBjDI0aNaJZs2bEx8dTr57aKETk7FTlo58xJtUYYyv4lIajsiIikej06dN8+eWXfP/99xQVFSmYFZEqs9ZSVFTE999/z5dffsnp06drukoiIjUiHC20O4DZfsb9HBgMvBGGckREItKBAwc4fvw4DRo0oE2bNkRHR6s1RUSq5PTp0xw7doz9+/dz/PhxDhw4QMuWLWu6WiIiZ1yVA1pr7Q4cQa0XY8w255/PVLUcEZFIdeTIEQDatGlDs2bNarg2IlIX1KtXz3082bdvH0eOHFFAKyJnpWprIjDGXAL0B74CXquuckREaruTJ08CEB0dXcM1EZG6xnVccR1nRETONtX5UKibnN9/tdZWeA+tMeZDP6MuCF+VRETOPNc9s+pmLCLhZowB0L35Ij5sf6uAnFfzALhsZCd6DT2vhmsk1aFarq6MMecAE4FS4LnqKENERETkbOcKaEXEW86reZScLKXkZKk7sJW6p7paaP8HiAVes9Z+GcwE1to+voY7W257h69qIiIiIiJS15WcLPX5t9Qt1dX/zdXd+Olqyl9ERERERETOcmEPaI0xFwEDgH3A6+HOX0RERERERASqp4U2pIdBiYiISGiysrIwxrg/w4cPr3KeaWlpHnlmZmZWvaJ1XHJysscyW7ZsWZXzbNq0qUeee/furXpFRUTqsLAGtMaYxsANOB4G9ddw5i0iIpHPdZHesWNHioqKfKZJSEjAGMOpU6eqVJYr2PAnNTXVI3Ao/8nNza1S+WVlZmZijGHTpk1hyxNg9OjRZGRkMHHiRJ/jX331VZKTk4mJiaFp06ZcfvnlLF261GfaESNGkJGRwaRJk8Jax7NBRkYGGRkZXHzxxV7jTpw4QUZGBt27d6dx48a0atWK//mf/2Hnzp0+87rnnnvIyMigZ8+e1V1tEZE6IdwPhRoHxAGvBvswKBEROfsUFBTwyCOPcPfdd9d0VZgxYwaxsbFew1u2bHnmKxOiMWPGkJqa6nPcokWLuPXWW2nRogUTJ06kYcOGrFy5ktTUVP7973+zYMECj/QjRoxgxIgRbNq0yW/QK775a80+efIk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uugie9NNN9kNGzZ4pD116pSdNWuW7dSpk23QoIEF7FVXXWWttbagoMDedNNNtlevXrZly5a2QYMGtnnz5vayyy6zDzzwgD18+LDPOnbs2NECNi8vz2t4x44dA877888/b3v27GkbN27snseyTp48aR9//HGblJRkmzdvbhs2bGg7dOhgBw8ebB9++GH7ww8/uNMuWbLEAnbJkiUBy3zllVfslVdeaZs2bWqbNGli+/bta7OysgJOs3HjRgvYjIwMj+GTJk3yW+bu3bvtddddZ2NiYmyTJk1s//797auvvhqwnmvWrLF9+vSxjRo1svHx8Xb8+PF279697nLKL2NrQ1v/1lq7efNm+/Of/9yec845tlmzZnbEiBH2448/thkZGRawGzdu9JomLy/PTps2zXbp0sU2atTINmvWzHbv3t1OnDjRrlq1yiPtVVdd5bUeyzt27Ji97777bJcuXWzDhg1ty5Yt7dixY+1nn30WcLpAy6E8HWNEfFv02w0eH6m9evfubYEPbSXiRWMdQWOtZYz5sHfv3r0//PDDmq6KiEiluF63cuGFF9ZwTaSuyMrKYvLkyV6tpeGwadMmBg0aREZGhs/X14SiOutZG7heS1Qd11KpqaksXbo0qN4AOsaI+PbEze94/J72lO5Zr6369OnDRx999JG1NuR3r6mfi4iISISaPHkyxhiGDx9e5bzS0tIwxjBo0KAw1OzsYozBGMOyZcuqnFfTpk0xxrB06dIw1ExEpO7TPbQiIiIRJjExkYyMDPfvLl26VDnPESNG0LJlS/fv5OTkKudZ16Wmpnosp4svvrjKed5zzz0er6/Se2pFRAJTQCsiIhJhEhMTSUxMDGueI0aMYMSIEWHNs66rjm7U99xzT9jzFBGpyxTQioiISLVITU2tk/fOiohI7aF7aEVERERERCQiKaAVERERERGRiKSAVkRERERERCKSAloRERERERGJSApoRUREREREJCIpoBUREREREZGIpIBWREREREREIpICWhEREREREYlICmhFREREREQkIimgFRERiTBZWVkYY9yf4cOHVznPtLQ0jzwzMzOrXtE6Ljk52WOZLVu2rEr5/fDDDx75GWPCVFMRkbpLAa2IiJwxrov0jh07UlRU5DNNQkICxhhOnTpVpbJcwYY/qampXsFD2U9ubm6Vyi8rMzMTYwybNm0KW54A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RzB6Q3WUIXKmTXtqsMfvcHXn6DX0PHoNPc9nd+KyZYba3VjOTq5tRtuLyNmn/HnKHx0fpKZMe2pwhdtfsNtxdfF3fee6XvNF+1TNCnsLrTEmDXgU+BwYZK09EO4yRERERERERMIa0Bpj0oHHgU9xBLP7w5m/iIiIiIiIiEvYAlpjzF3Aw8AOHMHsd+HKW0RERERERKS8sAS0xpj7cDwE6kMgxVr7QzjyFREREREREfGnyg+FMsZMAv4AlAKbgenGeD2VdK+1NquqZYmIiIiIiIi4hOMpx673mNQH0v2kyQaywlCWiIiIiIiICBCGLsfW2kxrrangkxyGuoqIiIiIiIi4hf21PSIiIiIiIiJnggJaERERERERiUgKaEVERERERCQiKaAVERERERGRiKSAVkRERERERCKSAloRERERERGJSApoRUREREREJCIpoBUREREREZGIpIBWREREREREIpICWhEREREREYlICmhFREREREQkIimgFRERERERkYikgFZEREREREQikgJaERERERERiUgKaEVERERERCQiKaAVERERERGRiKSAVkRERERERCKSAloRERERERGJSApoRUREREREJCIpoBUREREREZGIpIBWREREREREIpICWhEREREREYlICmhFREREREQkIimgFRERERERkYikgFZEREREREQikgJaERERERERiUgKaEVERERERCQihSWgNcaMNcY8bozZbIw5bIyxxpgXwpG3iIiIiIiIiC8NwpTP74GewFFgH3BBmPIVERERERER8SlcXY5vA7oBzYH/DVOeIiIiIiIiIn6FpYXWWrvR9bcxJhxZioiIiIiIiAQUri7HVWaM+dDPqIjovrz9rQJyXs3zGPbEze8AENWoPlsbl7DJnGQQjUg6EUXJyVL3uMtGdqLX0PPcebjGAQy4rgu9hp7nUUbJyVKP6XzVo2weLs/MyHYPj45pSOpDA0m96216HjI0xPMfEQl3v8YgGtHXRyO+a75c9XfnWf8gqedOhmY/gztyvaZ79t3/45G3dwGQPqQbv2nwGmyaB8VHHQma/Yztl653L8eoxvUpKSr1qrOXBd3h6H62n5rI1h+u8x5fxoDrugC4y3AvwwXd2f5tP3KO/hI4x/fEc9o5vpPvhgG30u/Bt/nuyElaN2/EP+8ZErBct62PO+YZPObb1/ICuHzO28Hn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)



## 12. Vector Filtering


Plotting vectors "as is" is often not practical, as the result will be a crowded
plot that's difficult to draw conclusions from. To remedy that, one can apply
some kind of filtering before plotting, or plot a derived quantity such as the
integral, sum or running average instead of the original. Such things can easily
be achieved with the help of NumPy.

Vector time and value are already stored in the data frame as NumPy arrays
(`ndarray`), so we can apply NumPy functions to them. For example, let's
try `np.cumsum()` which computes cumulative sum:

<div class="input-prompt">In[47]:</div>

```python
x = np.array([8, 2, 1, 5, 7])
np.cumsum(x)
```

<div class="output-prompt">Out[47]:</div>




    array([ 8, 10, 11, 16, 23])




<div class="input-prompt">In[48]:</div>

```python
for row in somevectors.itertuples():
    plt.plot(row.vectime, np.cumsum(row.vecvalue))
plt.show()
```

<div class="output-prompt">Out[48]:</div>


![png](data:image/png;base64,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)



Plotting cumulative sum against time might be useful e.g. for an output
vector where the simulation emits the packet length for each packet
that has arrived at its destination. There, the sum would represent
"total bytes received".

Plotting the count against time for the same output vector would
represent "number of packets received". For such a plot, we can utilize
`np.arange(1,n)` which simply returns the numbers 1, 2, .., n-1
as an array:

<div class="input-prompt">In[49]:</div>

```python
for row in somevectors.itertuples():
    plt.plot(row.vectime, np.arange(1, row.vecvalue.size+1), '.-', drawstyle='steps-post')
plt.xlim(0,5); plt.ylim(0,20)
plt.show()
```

<div class="output-prompt">Out[49]:</div>


![png](data:image/png;base64,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)



Note that we changed the plotting style to "steps-post", so
that for any *t* time the plot accurately represents the number
of values whose timestamp is less than or equal to *t*.

As another warm-up exercise, let's plot the time interval
that elapses between adjacent values; that is, for each element
we want to plot the time difference between the that element
and the previous one.
This can be achieved by computing `t[1:] - t[:-1]`, which is the
elementwise subtraction of the `t` array and its shifted version.
Array indexing starts at 0, so `t[1:]` means "drop the first element".
Negative indices count from the end of the array, so `t[:-1]` means
"without the last element". The latter is necessary because the
sizes of the two arrays must match. or convenience, we encapsulate
the formula into a Python function:

<div class="input-prompt">In[50]:</div>

```python
def diff(t):
    return t[1:] - t[:-1]

# example
t = np.array([0.1, 1.5, 1.6, 2.0, 3.1])
diff(t)
```

<div class="output-prompt">Out[50]:</div>




    array([1.4, 0.1, 0.4, 1.1])




We can now plot it. Note that as `diff()` makes the array one element
shorter, we need to write `row.vectime[1:]` to drop the first element
(it has no preceding element, so `diff()` cannot be computed for it.)
Also, we use dots for plotting instead of lines, as it makes more
sense here.

<div class="input-prompt">In[51]:</div>

```python
for row in somevectors.itertuples():
    plt.plot(row.vectime[1:], diff(row.vectime), 'o')
plt.xlim(0,100)
plt.show()
```

<div class="output-prompt">Out[51]:</div>


![png](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA9QAAAGDCAYAAADKwFjiAAAAOXRFWHRTb2Z0d2FyZQBNYXRwbG90bGliIHZlcnNpb24zLjMuMiwgaHR0cHM6Ly9tYXRwbG90bGliLm9yZy8vihELAAAACXBIWXMAABYlAAAWJQFJUiTwAABViUlEQVR4nO3df3xU133n//cZJBAg8UOSwZERICwR4RjbwRhii0bY7DptXNKYTWx3a9Jmk37b7W6h3SRu8t0262Z/2Ot82w00TdNtSPs17ndjJ8FNaNw6u7IhseKAMfEPAgQpCBBWDJZkjARICHS+f9wZGI3mx713Zu7cmXk9H495CM3MHR2he889n3M+5xxjrRUAAAAAAPAmUugCAAAAAABQjAioAQAAAADwgYAaAAAAAAAfCKgBAAAAAPCBgBoAAAAAAB8IqAEAAAAA8IGAGgAAAAAAHwioAQAAAADwgYAaAAAAAAAfCKgBAAAAAPCBgBoAAAAAAB8qCl2AfDDG9EiaJelYgYsCAAAAAMi9xZLOWmubClmIkgyoJc2aPn167bJly2oLXRAAAAAAQG4dOnRIFy5cKHQxSjagPrZs2bLal19+udDlAAAAAADk2K233qr9+/cfK3Q5mEMNAAAAAIAPBNQAAAAAAPhAQA0AAAAAgA8E1AAAAAAA+EBADQAAAACADwTUAAAAAAD4UKrbZgEAAAChdeTUkDq7+zU8cknVVRVqa67X0vk1hS4WAI8IqAEAAICAdHb3a0tHl/b2DE56bVVTrTava1Fbc30BSgbAD1K+AQAAgAA8+dIJbdy2J2kwLUl7ewa1cdsePfVSb8AlA+AXATUAAACQZ53d/frcjtc1btO/b9xKn93xmjq7+4MpGICsEFADAAAAebaloytjMB0zbqWtHV35LRCAnCCgBgAAAPLoyKmhlGneqezpGdSRU0N5KhGAXCGgBgAAAPLIb/o2ad9A+BFQAwAAAHk0PHIp0OMABIeAGgAAAMij6ip/O9X6PQ5AcAioAQAAgDzyu680+1ED4UdADQAAAOTR0vk1WtVU6+mY1U21Wjq/Jk8lApArBNQAAABAnm1e16KIcffeiJE2rWvJb4EA5AQBNQAAAJBnbc31emTD8oxBdcRIj264iXRvoEiw0gEAAAAQgPtvW6gFc2doa0eX9iTZl3p1U602rWshmAaKCAE1AAAAEJC25nq1NdfryKkhdXb3a3jkkqqrKtTWXM+caaAIEVADAAAAAVs6v4YAGigBzKEGAAAAAMAHAmoAAAAAAHwgoAYAAAAAwAcCagAAAAAAfCCgBgAAAADABwJqAAAAAAB8IKAGAAAAAMAHAmoAAAAAAHwgoAYAAAAAwAcCagAAAAAAfCCgBgAAAADABwJqAAAAAAB8IKAGAAAAAMAHAmoAAAAAAHwgoAYAAAAAwAcCagAAAAAAfCCgBgAAAADABwJqAAAAAAB8IKAGAAAAAMAHAmoAAAAAAHwgoAYAAAAAwAcCagAAAAAAfCCgBgAAAADABwJqAAAAAAB8IKAGAAAAAMAHAmoAAAAAAHyoKHQBgNA5fUg6ulsaHZKm1UhL2qV5ywpdKgAAAAAhQ0ANxBzdJe1+TDreOfm1RW1S+0PSkrVBlwoAAABASJHyDUjS/sel7fcmD6Yl5/nt90r7twdbLgAAAAChRUANHN0l7dws2fH077Pj0s5NzvsBAAAAlD0CamD3Y5mD6Rg7Lu3+Yn7LAwAAAKAoEFCjvJ0+lDrNO5XjLzjHAQAAAChrBNQob0d3B3scAAAAgJJBQI3yNjoU7HEAAAAASgYBNcrbtJpgjwMAAABQMgioUd6WtAd7HAAAAICSQUCN8jZvmbSozdsxi9Y4xwEAAAAoawTUQPtDknF5KZiI1P6Z/JYHAAAAQFEgoAaWrJXWb8kcVJuItH6r834AAAAAZY+AGpCkFR+TNj7tpHMns2iN8/qKjcGWCwAAAEBoVRS6AEBoLFnrPE4fcvaZHh1yVvNe0s6caQAAAACTEFADieYtI4AGAAAAkBEp3wAAAAAA+EBADQAAAACADwTUAAAAAAD4QEANAAAAAIAPOQmojTEfMcb8hTHmh8aYs8YYa4x5IsV7F0dfT/X4Ri7KBAAAAABAPuVqle8/lnSzpGFJJyW1ujjmVUn/kOT5AzkqEwAAAAAAeZOrgPoP5QTS3ZLaJT3v4phXrLUP5+jnAwAAAAAQqJwE1NbaKwG0MSYXHwkAAAAAQKjlaoTajwZjzO9IqpM0IOlFa+1rXj7AGPNyipfcpJwDAAAAAOBbIQPqfxl9XGGM2SXpN621JwpSIgAAAAAAXCpEQH1e0n+WsyDZ0ehzN0l6WNKdkjqMMbdYa89l+iBr7a3Jno+OXK/IRWEBAAAAAEgm8H2orbWnrbWft9but9aeiT5+IOluSXskNUv6ZNDlAgAAAADAi8AD6lSstZckfS367fsLWRYAAAAAADIJTUAd9Vb068yClgIAAAAAgAzCFlC/L/r1aNp3AQAAAABQYIEH1MaYFcaYST/XGLNO0h9Gv30i2FIBAAAAAOBNTlb5NsZ8WNKHo99eG/16uzHm76L/7rfWfjr67z+X1GKM+ZGkk9HnbpJ0V/Tff2Kt/VEuygUAAAAAQL7katusWyT9ZsJzS6IPSTouKRZQb5d0r6TbJP2KpEpJpyQ9JenL1tof5qhMAAAAAADkTU4Camvtw3L2kXbz3m2StuXi5wIAAAAAUChhW5QMAAAAAICiQEANAAAAAIAPBNQAAAAAAPhAQA0AAAAAgA8E1AAAAAAA+EBADQAAAACADwTUAAAAAAD4QEANAAAAAIAPBNQAAAAAAPhAQA0AAAAAgA8E1AAAAAAA+EBADQAAAACADwTUAAAAAAD4QEANAAAAAIAPBNQAAAAAAPhAQA0AAAAAgA8E1AAAAAAA+EBADQAAAACADwTUAAAAAAD4QEANAAAAAIAPBNQAAAAAAPhAQA0AAAAAgA8VhS4AAITZkVND6uzu1/DIJVVXVaituV5L59cUulgAAAAIAQJqAEiis7tfWzq6tLdncNJrq5pqtXldi9qa6wtQMgAAAIQFKd8AkODJl05o47Y9SYNpSdrbM6iN2/boqZd6Ay4ZAAAAwoSAGgDidHb363M7Xte4Tf++cSt9dsdr6uzuD6ZgAAAACB0CagCIs6WjK2MwHTNupa0dXfktEAAAAEKLgBoAoo6cGkqZ5p3Knp5BHTk1lKcSAQAAIMwIqAEgym/6NmnfAAAA5YlVvgEganjkUqDHAQCA0sJ2m+WHgBoAoqqr/FWJfo8DAAClge02yxcp3wAQ5fdGxw0SAIDyxXab5Y2AGgCils6v0aqmWk/HrG6qJZULAIAyxXabIKAGgDib17UoYty9N2KkTeta8lsgAAAQWmy3CQJqAIjT1lyvRzYszxhUR4z06IabSPcGAKBMsd0mJAJqAJjk/tsWavsnVmt1ivTv1U212v6J1brvtsaASwYAAMKC7TYhsco3ACTV1lyvtuZ6tr8AAABJsd0mJAJqAEhr6fwaAmgAADAJ221CIuUbAAAAADxju01IBNQAAAAA4BnbbUIioAYAAAAAX9huEwTUAAAAAOAD222CGfEAAAAA4NP9ty3UgrkztLWjS3uS7Eu9uqlWm9a1EEyXKAJqAAAAAMgC222WLwJqAAAAAMgBttssP8yhBgAAAADABwJqAAAAAAB8IKAGAAAAAMAHAmoAAAAAAHwgoAYAAAAAwAcCagAAAAAAfCCgBgAAAADABwJqAAAAAAB8IKAGAAAAAMAHAmoAAAAAAHwgoAYAAAAAwAcCagAAAAAAfCCgBgAAAADABwJqAAAAAAB8IKAGAAAAAMAHAmoAAAAAAHwgoAYAAAAAwAcCagAAAAAAfCCgBgAAAADAh5wE1MaYjxhj/sIY80NjzFljjDXGPJHhmDuMMc8YYwaNMReMMa8ZY/7AGDMlF2UCAAAAACCfKnL0OX8s6WZJw5JOSmpN92ZjzK9J+rakEUlPShqUtF7S/5DUJumjOSoXAAAAAAB5kauU7z+UtFTSLEn/Nt0bjTGzJP2NpMuS1lprP2Gt/YykWyS9KOkjxpgHclQuAAAAAADyIicBtbX2eWttl7XWunj7RyRdI+kb1tp9cZ8xImekW8oQlAMAAAAAUGi5Svn24q7o139O8toPJJ2XdIcxZpq1djTdBxljXk7xUtqUcwAAAAAAslWIVb7fHf16JPEFa+0lST1yAv0lQRYKAAAAAAAvCjFCPTv69Z0Ur8een5Ppg6y1tyZ7PjpyvcJzyQAAAAAAcIl9qAEAAAAA8KEQAXVsBHp2itdjz5/Jf1EAAAAAAPCnECnfP5O0Us42WxMWFTPGVEhqknRJ0tHgi4Z8O3JqSJ3d/RoeuaTqqgq1Nddr6fyaQhcLAAAAADwrRED9nKTfkPTLkv5XwmvvlzRD0g8yrfCN4tLZ3a8tHV3a2zM46bVVTbXavK5Fbc31BSgZAAAAAPhTiJTvb0nql/SAMWZl7EljTJWk/xL99q8KUC7kyZMvndDGbXuSBtOStLdnUBu37dFTL/UGXDIAAAAA8C8nI9TGmA9L+nD022ujX283xvxd9N/91tpPS5K19qwx5rflBNa7jDHfkDQo6UNyttT6lqQnc1EuFF5nd78+t+N1jdv07xu30md3vKbr5k5npBoAAABAUchVyvctkn4z4bklurqX9HFJn469YK39B2NMu6T/KOlfSaqS1C3pP0jaaq3NEH6hWGzp6MoYTMeMW2lrRxcBNQAAAICikJOA2lr7sKSHPR7TKemDufj5CKcjp4ZSpnmnsqdnUEdODbFQGQAAAIDQYx9q5E1nd3+gxwEAAABAkAqxyjfKxPDIpUCPAwB4cPqQdHS3NDokTauRlrRL85YVulQAABQVAmrkTXWVv9PL73EAABeO7pJ2PyYd75z82qI2qf0hacnaoEsFAEBRIuUbeeN3cTEWJQOAPNn/uLT93uTBtOQ8v/1eaf/2YMsFAECRIqBG3iydX6NVTbWejlndVMuCZACQD0d3STs3S3Y8/fvsuLRzk/N+AACQFgE18mrzuhZFjLv3Roy0aV1LfgsEAOVq92OZg+kYOy7t/mJ+ywMAQAkgoEZetTXX65ENyzMG1REjPbrhJtK9ASAfTh9KneadyvEXnOMAAEBKrP6EvLv/toVaMHeGtnZ0aU+SfalXN9Vq07oWgmkAyJeju/0fx8rfAACkRECNQLQ116utuV5HTg2ps7tfwyOXVF1VobbmeuZMAwiVkqynRoeCPQ4AgDJBQI1ALZ1fU/wNUwAlqbO7X1s6urQ3SSbNqqZabS7mTJppPutdv8cBAFAmmEMNACh7T750Qhu37UkaTEvS3p5Bbdy2R0+91BtwyXJkSXuwxwEAUCYIqAEAZa2zu1+f2/G6xm36941b6bM7XlNnd38wBculecukRW3ejlm0hvnTAABkQEANAChrWzq6MgbTMeNW2trRld8C5Uv7Q5Jxeds3Ean9M/ktDwAAJYCAGgBQto6cGkqZ5p3Knp5BHTlVhIt1LVkrrd+SOag2EWn9Vuf9AAAgLQJqAEDZ8pu+XZRp35K04mPSxqeddO5kFq1xXl+xMdhyAQBQpFjlGwBQtoZHLgV6XCgsWes8Th9y9pkeHXJW817SzpxpAAA8IqAGAJSt6ip/t0G/x4XKvGUE0AAAZImUbwBA2fK7r3TR7kcNAAByqgS62AEA8Gfp/Bqtaqr1tDDZ6qZaLZ1fk8dSAQBKDtNsShYBNQCgrG1e16KN2/a42jorYqRN61ryXygAQGk4ukva/Zh0vHPya4vanC0N2VWhqJHyDQAoa23N9Xpkw3JFTPr3RYz06IabSPcGALiz/3Fp+73Jg2nJeX77vdL+7cGWCznFCDUAoOzdf9tCLZg7Q1s7urQnSfr36qZabVrXQjANAHDn6C5p52bJjqd/nx2Xdm6S5jQyUl2kCKgBAJAzUt3WXK8jp4bU2d2v4ZFLqq6qUFtzPXOmAQDe7H4sczAdY8el3V8koC5SBNQAAMRZOr+GABoA4N/pQ6nTvFM5/oJzHAuVFR3mUAMAAABArhzdHexxKCgCagAAAADIldGhYI9DQRFQAwAAAECuTPM5bcjvcSgoAmoAAAAAyJUl7cEeh4JiUTIAAFB+Th9y5iuODjmjQkvaWQwIQG7MWyYtavO2MNmiNdRBRYqAGgAAlI+ju5ztbJI1dBe1Se0PsXUNgOy1PyRtv9fd1lkmIrV/Jv9lQl6Q8g0AAMrD/sedBm6qUaPjnc7r+7cHWy4ApWfJWmn9FidYTsdEpPVb6cgrYgTUAACg9B3dJe3cnHm0yI5LOzc57weAbKz4mLTxaSedO5lFa5zXV2wMtlzIKVK+AQBA6dv9mLvUS8l53+4vMmIEIHtL1joP1m0oWQTUAACgtJ0+5G1xIEk6/oJzHA1eALkwbxn1SYki5RsAAJS2o7uDPQ4AUDYIqAEAQGkbHQr2OABA2SCgBgAApW1aTbDHAQDKBgE1AAAobUvagz0OAFA2CKgBAEBpm7dMWtTm7ZhFa1hACACQEat8AwCA0tf+kLT9XndbZ5mI1P6Z/JcpCGzVAwB5RUANAABK35K10vot0s7N6YNqE5HWby3+PaiP7nL23k62XdiiNqeDodh/RwAIAVK+AQBAeVjxMWnj0046dzKL1jivr9gYbLlybf/jzmh8qr23j3c6r+/fHmy5AKAEMUINAADKx5K1zqNUU6GP7so8Ci85r+/cJM1pZKQaALJAQA0AAMrPvGWlEUAn2v2Yu3nikvO+3V8koAaALJDyDQAAUApOH0qd5p3K8Rec4wAAvhBQAwAAlIKju4M9DgBAyjcAAEBJGB0K9rhCKtU58ACKDgE1AABAKZhWE+xxhcB2YABChoAaAACgFCxpD/a4oO1/PP0K5rHtwNZvLf6tz4ASNNA3rJOH39bYyCVVVlVoQetc1TVUF7pYWSOgBgAAKAXzljmjtF4WJlu0pjhSpdkODChavYcHte97x9TXdWbSaw0tc7TynsVqbK0NvmA5wqJkAAAApaL9Icm4bN6ZiNT+mfyWJ1f8bAcGoOAOdvZp55ZXkgbTktTXdUY7t7yig519wRYshwioAQAASsWStdL6LZmDahNxUqOLYRSX7cCAotR7eFC7njgsa9O/z1pp1xOH1Xt4MJiC5RgBNQAAQClZ8TFp49NOOncyi9Y4rxfLPGO2AwOK0r7vHcsYTMdY67y/GDGHGgAAoNQsWes8SmF7qXLaDgwoEQN9wynTvFPp6zqjgb7holuojIAayJMjp4bU2d2v4ZFLqq6qUFtzvZbOL6KtSQAAxW/esuILoBOVw3ZgQIk5efht38cRUANlrrO7X1s6urS3Z/I8kFVNtdq8rkVtzfUFKBkAAEWo1LcDA0rQ2MilQI8rJOZQAzn05EsntHHbnqTBtCTt7RnUxm179NRLvQGXDACAIhXbDsyLYtkODChRlVX+xm39HldIxVdiIKQ6u/v1uR2vazzD4gvjVvrsjtd03dzpjFQjEEw/AFD02h+Stt/rbuusYtoODChRC1rnBnpcIRFQAzmypaMrYzAdM26lrR1dBNTIK6YfACgZse3Adm5OH1QX03ZgQAmra6hWQ8scTwuTNbTMKbr50xIp30BOHDk1lDLNO5U9PYM6cooVSJEfTD8AUHJKbTswoMStvGexjHH3XmOc9xcjRqiBHOjs7vd9HKm3yDWmHwAoWaW0HRhQ4hpba7X2wVbteuJw2v2ojZHWPtiqxtba4AqXQwTUQA4M+1yR0O9xQDpMPwBQ8kphOzCgDNzQ1qCauirt+96xpOnfDS1ztPKexUUbTEsE1EBOVPtckdDvcUAq2Uw/IFsCAABckaNMkMbWWjW21mqgb1gnD7+tsZFLqqyq0ILWuUU5ZzpRwVrzxphjkhalePmUtfbaAIsDZMXv6B6jgsg1ph8AAICsHN0l7X5MOt45+bVFbc6q+z4W/qtrqC6JADpRoYfH3pH0pSTPDwdcDiArS+fXaFVTraeRwdVNtQQwyDmmHwAAPGNOOmL2P55+Nf3jnc4Wduu3sgBgVKED6jPW2ocLXAYgJzava9HGbXtczV2NGGnTuhbPP6NUU2WQO0w/AAC4lqeRSBSpo7syb00nOa/v3CTNaeT8UOEDaqBktDXX65ENyzOurhwx0qMbbvKU7t17eLCkF3NA7jD9AADgCiORSLT7sczBdIwdl3Z/kYBahQ+opxljHpS0UNI5Sa9J+oG19nJhiwX4c/9tC7Vg7gxt7ejSniTp36ubarVpXYun4OVgZ1/a7Qb6us5o55ZXtPbBVt3Q1uC36CgRBZ9+QNogAIQfI5FIdPpQ8kyFdI6/4BxX5vf5QgfU10ranvBcjzHm49ba3ZkONsa8nOKl1qxLBvjU1lyvtuZ6HTk1pM7ufg2PXFJ1VYXamus9By29hwcz7t0nSdZKu544rJq6KkaqEcj0g0lIGwSA4sFIJBIdzRh6pT6uzAPqSAF/9t9KWicnqJ4pabmkv5a0WNI/GWNuLlzRgOwtnV+jj7c16ffXtejjbU2+RgD3fe9YxmA6xlrn/UBs+kHEpH+fn+kHSe1/3EkLTNWzHUsb3J/YfwoACFw2I5EoXaNDwR5XQgo2Qm2t/dOEpw5I+l1jzLCkT0l6WNK9GT7j1mTPR0euV+SgmEDBDPQNJ50znU5f1xkN9A2zUBnyMv0gKdIGAaC4MBKJZKb5nPrl97gSUuiU72S+Kiegfn+hCwIU0snDb/s+joAaUm6nH6RE2iAAFBdGIpHMkvZgjyshYQyo34p+nVnQUgAFNuZzX2C/x6F0LZ1fk589z1nABACKDyORSGbeMmfNEy/39UVruJ+rsHOoU3lf9OvRgpYCKLBKn/sC+z0O8CybtEEAQGEwEolU2h+SjMvw0ESk9s/ktzxFoiAtb2PMMkknrLXnEp5fLOnL0W+fCLpcQJgsaJ0b6HEIkWLZeoq0QQAoPoxEliVX07+WrJXWb8m8NoqJOPuTM4VLUuFSvu+X9CljzA8kHZc0JOl6SfdIqpL0jKT/p0BlA0KhrqFaDS1zPC1M1tAyh/nTxazYtp4ibRAAilP7Q87uC27WwGAksqh1dvdrS0eX9iZZoHRVU602Jy5QuuJj0pyFzponx1+Y/IGL1jjnQ5jaIwVWqID6eUnvlvReSW1y5kufkfSCnH2pt1vrdrMgoHStvGexdm55xdXWWcY470eR2v94+h7h2NZT67dKKzYGW7ZUSBsEgOLESGRZePKlE/rcjtc1nqIdubdnUBu37dGjG27Sfbc1Xn1hyVrnUSwZcwVWkIDaWrtbEpPogAwaW2u19sFW7XricNqg2hhp7YOtamytDa5whVCqFXuxbj1F2iAAFC9GIktaZ3d/2mA6ZtxKn93xmq6bO33yVprzlnHPdoHVi4CQu6GtQTV1Vdr3vWNJ078bWuZo5T2LSzuYLrZUaK+Keesp0gYBoHgxElmytnR0ZQymY8attLWja3JADVcIqIEi0Nhaq8bWWg30Devk4bc1NnJJlVUVWtA6t/TnTBdjKrQXxb71FGmDQNEry3sLJmIksqQcOTWUdM50Ont6BnXk1FB+ttkscQTUQBGpa6gOrpETht7qYk2F9iKbrafC0vghbRAoSr2HB8s7+wkoUZ3d/b6PI6D2joAawERhSq8u5lRot0pl6ynSBvPC1TYngA8HO/vSrs/R13VGO7e8orUPtuqGtoZgCwcgK8MjlwI9rtwRUAO4Kkzp1cWeCu1WqW09RdpgTnje5gTwoPfwYMbFLiXJWmnXE4dVU1fFSDVQRKqr/IV4fo8rd5FCFwBASHhNrz66K8/lySIVupiw9RQSPPnSCW3ctifl/LfYNidPvdQbcMlQKvZ975ir7RglJ6je971jeS0PgNzy2+FKR60/BNQAHH7Sq/OpVFKhM4ltPeUFW0+VLK/bnPidJ4fyNdA3nHTOdDp9XWc00DecnwKVmtOHpB9/1blH/virzvdAwJbOr9GqJm9ZJaubaplS5BPj+gDCmV5daqnQ6bD1FKLCus0Jc7lLx8nDb/s+jpW/0wjT+iOApM3rWrRx2x5X95SIkTata8l/oUoUATWAcK40XU6p0Gw9BYVjm5PE7ZPemmH0P1/tZS53CRnzueiQ3+PKQpjWHwGi2prr9ciG5RmzniJGenTDTdTlWSCgBhDO9OpYKrSXkfNiToVm66myV8htTtJtn7RkymW9WRXRicqJwUJsLvejG27Sfbc1ZvXzEZxKn4sO+T2u5JXD9o4oWvfftlAL5s7Q1o4u7UnSMbq6qVab6BjNGrUjgPCmV5dbKjRbT5W1Qm1zkm77JCurxstT9NFzET07fUwHpl2e8HpsLvd1c6fTICsSC1rnBnpcySuH7R1R1Nqa69XWXM/UnTwioAYQ3vTqck2FZuupslSIbU4ybZ9kZCRJERl94EKlzkbspJHqIOdyI3t1DdVqaJnjaWGyhpY5zJ9OJozrjwApLJ1fQwCdJ6zyDSDcK02v+Ji08Wnn56Uqx8anmZeGoleIbU68bJ8UkdHtI8mD99hcbhSHlfcsljHu3muM834kUS7bOyIQA33DevW5Xu17pkevPtfLyvpFhBFqoNDCkt4b5vRqUqFRBmLbnHhZmCybbU68bp9kZbXw8hTVXTYamDI5Cs/FXG4Eo7G1VmsfbE2bnSA5wfTaB1vV2Opt+52yEcb1R1B00q1h0dAyRyvvWcw1GHIE1EChhG2LjWJIryYVGiUuyG1OvG6fFEv/XnQpooEplye9nu1cbgTrhrYG1dRV0ZDPRljXH0HRSLeGheTsAb9zyyta+2CrbmhrCLZwcI2AGiiEsG6xwUrTQEEFuc2J322QptrkucLZzOVGYTS21qqxtXbSdmkLWucyZ9qNsK4/gqKQaQ2LGGulXU8cVk1dFR1cIcXdDwha2LfYIL0aKKigtjnxuw3SRZO89Vcsi5IRPE5W11Bd9v8HvpTb9o7IKS9rWFjrvJ+AOpwIqIGgFcsWG6RXAwUTxDYnXrdBsrIyMjpeMbn+ymYud1CYp4i8CPP6Iwgtr2tYSE7690DfMJ1fIURADQSJLTYAeJDPbU68bp9kZHRiyuVJC5JlO5c7CMxTRN4Uw/ojCB2va1jEH0dAHT5smwUEiS02AISIl+2TxmX1YtXEede5mMudb17nKfYedr/KOiCJ7R3hmd81LPweh/xihBoIEltsAAgRt9snjcvq2eljOlF5dQQuV3O58415iggE64/AA79rWPg9DvnFXwUIEltsAAgZN9snXXvHfFWPX9QH8jCXO5+Yp4jAsf4IXPC6hkW2xyG/CKiBILHFBoAQcrN90u15+tn5XHWbeYoAwsjrGhaS07lJvRROBNRAkNhiA0CIBbl9UhCrbjNPEUBYrbxnsXZuecXVlBRjnPcjnFiUDAha+0POap9usMUGgBJ0sLNPO7e8knJ0pq/rjL77pVf0/D8dzernME8RQFjF1rDItDCkMdLaB1tZ2yHEuGMAQSvSLTbymZYJoHy4XXVbkg58p0f/66d9+s0Pt/pa/Cys8xSpTwFI7tawyEW2DvKLgBoohBUfk+YslHZ/0dlnOtGiNc7IdAiC6SDSMgGUDy+rbkdkNLfngjZu26NHN9yk+25r9PSzwjZPkfoUQCI3a1gg3AioMzhyakid3f0aLrKVTVEEimCLjYOdfWlHkvq6zmjnlle09sFW3dDWEGzhABQdr6tuW1ktvDxFcy8ZfXbHa7pu7nTPI9VhmadIfQognSDXsEBuEVCn0Nndry0dXdrbMzjptVVNtdpcBHtvokiEdIsNt2mZ1kq7njismroqRlYApOV11W0jZ3LhoksRDUy5rK0dXa7vvfEd4lWr63VxT7+Upj7L5zxF6lMAKF0E1Ek8+dIJfW7H6xpPcePb2zPoO/0MKBZe0jKtdd5PAxDFgtS6wvC7evZU6wTWe3oGdeTUUNpMsVQd4gtnRPQBM11zhievXZHvdGvqUyC/qNNRSATUCTq7+9MG0zHjVr7Tz4Cw85qWKTnpigN9w9zAEGrMYS0sv6tnXzRXb8qd3f0pA+p0HeInKsf1Nzqna2YZ/bsbGnXjvOpAGt7Up0D+UKcjDNg2K8GWjq6MwXTMuJW2dnTlt0BAAXhNy8z2OCAIbrZq2rnlFR3s7Au2YGXE6+rZNpqjfbzi6qjycIpRbrcd4m9FrL7wsxMaXVqjm+9qzHvQSn2KsnP6kPTjrzoLr/74q873eUCdjrBghDrOkVNDSedMp+Mm/QwoNn7TMv0eB+Qbc1jDweuq20ZGJ6Zc1sCUq3+46hSj3H46xIPIMKM+zYx03RJxdJe0+zHpeOfk1xa1Se0P5Wz3Eup0hAkBdZzO7n7fxxFQo5T4Tcv0exyQb8xhDQ8vq26Py+rFqomBZbIgOMwd4tSnqZGu611oOx/2Py7t3CzZyWsUSHKC7O33Suu3Sis2Zv3jqNMRJqVfW3uQKo0sX8cBYeU1LTPb44B8Yg5ruDS21mrtg61XRpes7JXVvKWr34/L6tnpYzpRebWBvrqpNmkAHOYOcerT5NhGzJtQdz4c3ZU+mI6x49LOTdKcxqxGqqnTETbMoY6TKo0sX8cBYRVLy/SioWUONyqEEnNYw+eGtgat33yLZi6YOSGYlq6meX9z5kUdmHb5yvMRI21a15L088LcIU59OpnXdN3ew96yD0pN6OcK734sczAdY8edudVZoE5H2BBQx/E7l6rYV/ke6BvWq8/1at8zPXr1uV4N9A0XukgIgZX3LJYxmd8nOfu3rrxncV7LA/jFHNZwamyt1W/98WrN2dCo56Zf1A+rxtQx/aK+XjOiJ2suThiZjhjp0Q03pbzfhr1DnPp0Ij/puuUq9J0Ppw8lnzOdzvEXslqojDodYcPQapyl82u0qqnW0zysVOlnxSDU6UMouMS0zFSMkdY+2Mq5gtBiDmu4/cbdLVq8ZK62dnRpf5L77+qmWm1a15K28zrsHeLUp1eRrutN6OcKH93t/7h5y3wdSp2OsOHMSrB5XYs2btvjaqXQdOlnYcfcJbhxQ1uDauqq6HhBME4fchpZo0PStBppSbvvBlc85rCGX1tzvdqa63Xk1JA6u/s1PHJJ1VUVamuud9VpXQwd4tSnjmzSdcstoC6KzofRoWCPE3U6woeAOkFbc70e2bA8416WmdLPwoytBuBFY2utGltrw7uyKIpfnrda8bpVk1T6c1jDaun8Gt9BbjF0iFOfkq7rRVF0Pkzz2Snl9zhRpyN8CKiTuP+2hVowd4a2dnRpj8/0szALffoQQqmuoZqbEXIvoK1WvGzVVA5zWEtRMXWIl3N9Srque0XR+bCkPdjjoqjTESblVzu5lG36WVgVRfoQgPIQ4FYrzGEtD6XeIV4KSNd1ryg6H+YtczKJvCxMtmhN1tN5qNMRJgTUGWSTfhZGRZE+BKA8+NlqJYvUb+awlodS7RAvFaTrulc0nQ/tDzmZRG7qcxOR2j+Tkx9LnY6wIKAuUn7nXxVF+hCQQU7mH+ZpASy4lM1WK1n8nZjDWj5KrUO8lJCu607RdD4sWSut35I548hEnOk7WXSMJqJORxgQUPtQyIs2262uiiJ9CEghJ1u95XkBLLjkcauVgbFGnbx4k8aefl2VLdVOvVvR67tTpJznsAKFRrque0XT+bDiY9KchU4m0fEXJr++aI0zMp2n+yt1OgqJKMmDQu/bnIutroomfQhIkJOt3gJaAAsuuNwypXd0ufYN36++sfc4T/xE0k+6JEkNlT/Vyuon1Tjt9asH0CkCFAXSdd0pqs6HJWudBxlgKDME1C7lat9mv6PbudrqqmjSh4A4OTn/A1wACy642DLl4Pl12nX292QVkWQlmbhXrfrG3qOdbz+stbO+ohtmdDhP0ykCFA3Sdd0pus6HecsIoFFWCKhdyEVjPtvR7VxudVXI9CFumvAjJ+d/wAtgIYMMW6b0ji6PC6alicH01e+tItp19vdUM+X01ZFqOkWAouImXbfc2w90PgDhRUDtQraN+WxHt3O91VUh0ocKnS6P4pWT879AC2AhjQxbrewbvj8umE7PKqJ9w/dNTP2mUwQoCbQfJmKuMBA+7lorZSybxrzkfXS79/DkfTOz2eoqlRvaGrR+8y1qaJmT9PWGljlav/mWtOnrbh3s7NPOLa+k/H+MdSgc7OzL+meh9OTk/Pe4AFbWx8Gd9oecVV8TDIw1RudMu+zJlFXf2I0aGGuc+HSsUwRAUQpT+2Ggb1ivPterfc/06NXneq+08/LtyKkh/W1nj/6io0t/29mjI6fcrT8BIDiMUGeQ7b7NuUhVzddWV0GkD+Vq7jcpTqUt3d83J+e/ywWwJvF7HNxJsdXKyYs3Rf+VmOadirlyXF1l78SXju4OVZYBdRngTq7aD7koRyFGyDu7+7Wlo0t7eyYPtKxqqtXmdS1qa67P+c8F4B0BdZxkDZ1sGvO5StXO91ZX+Uwf8tuhcOTUkDq7+zV8fFgVh4c0fnpk0vvLMdWr1LhpqOTk/HexAFZSfo+De0m2Whmz0319VNLjQtIpQtoq4E0u147xK1cL0nr15Esn9Lkdr2s8xc/d2zOojdv26NENN+m+2xqTvwlAYAiolb6hM+safw27yqqKrEe3Y4p1qyu/HQq/9aVO7XrzjJaPTtHdFyo1LiMrK5MwWpWvG1kxKsZRL7cNldt+tcnX5084/zMsgJWS3+PgTcJWK5WvVUn7vX9Mpbkw+ckQdIoUqlEOFKtcrx3jR6FGyDu7+9MG0zHjVvrsjtd03dzpjFR7UIztJYRf2QfUmRo6Z99K0kBz4fw7oxobvezr2MRR8WLa6iq+onrrhL/5RWePD2lhJKK7L1QqEg2iE4PpmHyneoVdsY56eWmovPSPPaq7bqYG3jjn+vMnnf8ZFsBKatGaUKUKJwp7o8BX+aJbrSxYOCzt3+vhpzlbai2Y+trklwrcKRKWtFW4F/ZrqxzkakAiG4UaId/S0ZUxmI4Zt9LWjq6iC6gLcY0Va3sJxaGsA2q3DR0/9j97wvexyVJcC7nVlRvpKiqvplqjO0amXAmmM8nmRlbMDadiHvXy2lCRnPM6q/O//SFnf2I3W2eZiNT+GXcFDFjYGwW5KJ/3TkSjhsoDk+dPZ9kpkov6IQxpq3An7NdWOclq7YxopotGh5wMlSXtnuuBQo2QHzk1lHTOdDp7egZ15NSQls4vfDZOosQ6tGJqREf2nAr8Givm9hKKQ1kH1F4aOkFKlqrtdqsrSWq+dZ5mzJqap9I54ivJgb5z6n75tPsFeTOotFLj5SlJ07xT8XojK/aGUzGPevlpqAy8cU63rW/Svn/sSfE7OyOURuNaW/MVNb44Ik19SANVK+Nu5tdrQdtfqq7z36UPqk1EWr/VOfa53sA6W9wEb24aBd/90itqurle1717ru8y+w0kc9lo8dSJqHGtrH4q4Un/nSK5qh/CkLYKd2hwh4vvtTNe/Zq098uTX1jU5nSqutxGr1Aj5J3d/b6Py2VAnW1nop9BlnxdY8XcXkLxKNuA2k9DJwjpUrVvaGtQTV1Vxkqqa99pde07nbPAML5iPffORZ3qOau3TuR+oZ/EANptMB2T7EaW7KZwquds0TecinnUy29DZdr0Cq3ffEuK899oVqRPDVMPacxW6aeHpCM/eV19FxMD52vVsODbWln9TTWe+f8m/5BFa9S7+NPa9/xs9XVNTjlOdU1l0/hI1/C4ZmGN5jfN0szZU3XuzVM6sPec3Kx83fNqv3pe7U9bZq9lmXXNdDU0z1Z9Y03S3y/XjZbMnYhxnSizvjJxD+pop4ifPaiz7bTIxbSXXKatIjMa3OHjfQ2Y6LSP4e9Ilc7Weycv3qQxO12V5oIWdL+muhP3OvXCio0ZPy1fu6tkMuzzeL/HJcrmHhCTqQ5NJx/XmNf20q6//5k++G+XUwfDk5IOqNM1cv026mddM933vGo3ahtmat8zPSkb5fFbXe175pi6951O+VnZBoa5TON2w8joF5HLGvMWR18RfyPLtuxhbjiFYdQrmwAym4ZKY2utGqe+poGv/4FOjt6o/rHF6ht7j85efpfOjjfo7EiDNGFBeKeRFa/vpPRdfVSr7vq4blu4f0Ja4MGu2dGGwJmkZUi8prIdyczU8HjrxFBC55X3i8NtPeBmPYmzb12QXnxT0uTGVT46edJ3Ijpp3iurn5oYTC9a44xM+wimvUwDSuy0WLS8TsdfH8hJfdl7cKCopp8Uu2LuoMyHMEyF8jvt4/z4HP1g4Hei+9hP1FD5U6381t+ocU5jQvZSxZUAPtvOsLdODE+413r9v6z2OTLv9rh05fF6D4i/x8U+t793SIejr/uVy2vMT3vp7FsX9I0v7FVNXZUW3VinG9uvK1hdHIZrEe6UbEB95tR5feMLk0eYYheI8Rm0Lbv9WjXdco1+tudN/SSLedKpHNj9xoTvUzXKz5+9qJ+/nDqYjvEbGO79Xo9e2tnj+v258q7xKaoa9ffHOfTim5q/ZLaGBkZyMjc+rA2nQi7Wki6AdHvzyXobrN2Pqa7iuE5dbNbPRu6SVUTJAmdH6nNp73PD+vl179Xyuxbo0vlx9f/TkA6/eDhjOayVnt9+WD/9wRs6fTx1pkZsJLNl5TxVVVfq3JmLmjlnqiqmTZGRcw17b3ik+j3dlTlVPeBnPYnExpVXbjt54jsRJzUsKt4lHZ2a1VzJeH6nAfV1nclpx+PxA4M6fmBvqKaflGrDLgwdlGERtqlQXqZ9SOO6prJbO99+OMU9wapv7D367uAyzd7ar3dGvCx66N7RV97S0Vfe0ozZU2XHrS4MjU16T7qRXr+Li7U116e9RjONPM++pkq9B721LWL3uNnzpuud07kdaMr2Gov9X/QeHPBdhqGBER3Y/YYO7H4j8PM/bNciMjM2jJOIs2SMebmxvmXFH/2rr+b8s9fc16Kb72rUq8/16oWnunL++ckYo0mjS0//2X7Pq37f+6kVGd/Xe3hQnd/s8rSicjYm3/Kupn17mUOdTw98flUwDSeXC6nse6ZHe77rvbNj9YeatPKD/ragkrylcaVrMAz0DSft7Mrkgc+vUl1Fr/SV96l3dHlcwwluVUyLqPV979LM2VMnjMo881ev5zXzJpX3fmChZs6eVtAgLdbweuf0eb2+643MBwQsVv9XNNeos7tfwyOXVF1Vobbm+kAWIUrXsIvMq9Kl1hpVL6oOrDy59uLT3b4WEY21BUqF2/p93uIaVc+p0pRKo8tj9srXmXOmava8GTm/hr2lD/vrcCy0xADpvr9+0fXCZHWXjT4wdaZaVamhgZFJr8+cO02RiDQ0MJrTMgfBzzWW78zKOzfmfyqgm3M+WVxQrm699Vbt379/v7X21kKWo2RHqPMl1gDNdp6MF4mjzPnqUc9m3otfibe+bOZQ50u2I7tHTg2lbwgf3SXtfiz5lk5JFlLxO8J77p2Lvo6TvI9gJo5ezpg9VbPrp6u+sVqz583QNQtrPM3Dv7K2wI93S5L2Dd9PMO3DpdHxSVkwhZQsy6dh0VStfPfP1Vh3elLHUi5HSYOe0uKXtdJz2w/rqZmjOlE5cU2AVU212ryuJS9b5gz0DetH3+7WiZ8mb9hbWY2fHpFOX9C3p7+hP512MOvyBDkKnu3fv7839+uIFIqX+v30sSGdVvrfPZcjaG7XjnGEo83gVeK0nM3rWrRx2560W2ctHIvojpEKNV6eIumyhpR8m9ZzbxdfIB3jtZ0dRBv2+e2HNXJuTCvuXpSXzy+n9RxKLeuJgNqD+AXD/AY1fsWnH+cj5bf38KCef+JwzlbqLiV+O086u/u1paMraU/zlYbn2WeknZtTrzp9vNPZ6iluIRXvi7U4DvzgDV2zsMZXj2a2K+Kff+eizr9zUb/4+Tuej52wDdbokAbGGqPz44pzNALpWPUdv6idx6/T2lnf0Q0zOiRJvXN+XfuG71PfyclHpAvAUylE52E2jKRfOzdV35l5cUJQvbdnUBu37dGjG27SfbflZrTUbZZSrMMzIqMPXKjU2Yj1XZ6g0xtz8fc//OKbelfznKxGiMLSoMz1jie5Xtgz9rf/7pZXSraNEus4+9Evzuj9v9SoRzYs1+d2vJ40qF4+OkV3X6h0vbVosfLSzs7nNriJXtzxc1XNrEx7bmccSEkhiPUcfJUtB1vRxZRqOjsBtUtW0sCiqit7/fkNarIRG2XO9eqTvYcH9c9//Xreb1SxFG63qdxhSfn203ny5EsnUt4MJach/Fdf36Y7pj4qowz7Ittx6bu/L8UtpFJTV5U0vSv95/jo0Tx9SAMvv6i+rsUqVAB707rGq+UdO6eTF2+KvlL4cwO5FpvuEdGus7+nmimnNXR5nna9+ZFo9ZRkXmSSADzdFjlBNrxyxcqqSkYfPTdVz04f04FpV0ejxq302R2v6bq5072PDCc0kg6+fZue/473Tq+IjG4fqdCJyouey5Pv7aoSG4+tkan6yRM/y8nf3+8IUeANyjSN4XzteOJ1BC1T58K+7x0r2WA6xkjqev4N/Zd9PVrVVKs/+uVWPXf4tPbEdcqvHJmitSOVoWgb5dvFC+7bukFvg/t8inPb1UBKinox3+s5+CqbxwzKTEp5e0IC6jRiTbdxWacRs69HilZ0m9e1eFyBMjdOHn47+0Wd4hzs7NPz2zMvxJQLsRuA2xtB4W8Y0W045r0tyf1oS2d3f9pgOuY/VmzPHExH9Y7eqH1f7lLfeXfvT8V1j2ZcJXry3D2SPqlCBbCvdfSqtuKkbnj7i9LxTo3ZjxSkHAiWVUSdZz+uwcuL4tL7J08Sib03FoA3Tns9aWZHTNANr1xINhocP1I9bqWtHV3uA+okjaTe0eV6/u1mycdUCiurhZenqO6y0cAU67o8+UxvTNV4fGBoqhrtFFefkYmfEaJAG5QuGsMnj12f3c9Iw83/j5vOhRmzpoZ+akYuxF9He3sG9VLPoBbXz7zy+vLR8gmmJemlf+zRtdfPznh9FWQb3CTntpuBlC98/dt69JZBvXd+xaTOrXwuOOumbJOyi/Y/7jmDMp1ST2cv6CREY8wCY8zXjTF9xphRY8wxY8yXjDHBD/8mYSSdmHJZ35x5ccKIQOzEO9c80/dq4X6NjVzyPTqeeFzs5A7KeNF1LxvNmXJSdd/6JelvP+g0TlzY0tGVMZj+/Snf1rJIr6vPO3h+nXa+/bD6zl+vXHTRx3o0U9r/uFNJRhthY3Z61j8zG9ZKu/75snqPnJUkVZrgF89CIVgNXG5yPVfeKqJ9w/fFPTEu7dw04botSMMrx2KjwYn29AzqyCkX83oTru+YzqF/I79NglgDf9Glq8e7KY+f9EY3nnzphDZu2zMpmK67bNR4eYpsDu9FGevTOF4blL2H3S1MlVSKv/MV0cbw2NGX/f8MF9L9/xzs7NPOLa+kvCZjnQsvP3MsfwUMkcTryErq6XemXiwci+juC+UTTEvur3m/gWi24s/tTAMpd0QO6MmpX9CzUx/Sew8+Kj3/X6R//iPpK++70r7M197nbgd5YtlFnd39zn0zXTAdk+Q+m0q+6vuwKFhAbYy5XtLLkj4uaa+k/yHpqKTNkl40xtQVqmz7p42pY/pFfb1mRE/WXJy0EIzknHif/3G3Fty9IGNQbYzUsnJeTspWWVVxZX9GL+Lnf8cEOVJjZfVmJLvR1UI4c7lBvaPLr/bE7d+e9v1HTg1lXJ3zjsgB/WHFt139/N7R5dp19vfSjND5k/IGlKQSDUMAGx8sLZj62pVnUcpi57rbv7NV39iNGhiLyyax49LuL175tlANr1yKH8VK1Nndn/7gFI2kl4Y+qoFLi7Mu21Q7sUzpyuO1c8PKugpe0zUeY4FKroMStwv9Bdag9NAYrjzyTX8/w4Nk152XzoWufZm3CC0lideRJN0xUlHyc6aTcXPNB7lIcKLYuZ1uIOW+Kc9re+UjWh1Jcb5H25eV/T/xVYZMC866GeSJiWUXafdjmeuPmIT7bDLZpLMXi0KOUH9F0jxJm6y1H7bWftZae5ecwPrdkv5roQr2dsRq/7TLGpiS/gwct9Lfnx7Q+s23pAxwG1rmaP3mW3TrBxfnpGyxUeaV9yx2PTo+YVGnqKBHaoyMrh0vxlWZ40a9XPTEZWzQStpcsUMRl3+7fK1mnfIGlKQSDUcAezVYqqvsVUPlT8Uc6nLh9u/svO/qHPuo4y84c0hV2IZXriQbDY4ZzvT7Jbm+e0eXa++5B3JStotmYh2RrjxeOzdiv/cPX0iyMl2cdI3HZuUnMDt+IPNet4E2KD00hhdUvur98z1Kdt0V49SLoCReR/nIrCgmmeqKoBcJjjc2cintQModkQN6pOJrmhL9m6Zst9txLTjysK8ynDp2NuVrbgZ5Eg0eey11ZksqcffZZLJJZy8WBYlwoqPTd0s6JukvE17+T5LOSdpojJmpAkjWO5jKnp5BXZhbqXs/tUIPfH6V1tzXotUfatKa+1r0wOdX6d5PrVBja63qGqp1zcLs9uiMH2VubK3V2gdbXY2Or32wddI8hEKcpBEZjRXdDSFh1CtDT1ymBm2LOZm6lzLBxNWsc+viaJItNk4fSlqJ1lX2aqo5p8IGsBODpaXTnytgWRBmSacoHHW2WytkwyvXkt2nqtP9fimu733D9ytXTYHjFRODuHTl8b17wqHUQXGmxuOaKf5GgDIZGhjJGPgG1qBM8XdOpa6yV7Miv/BYKm8Srzv/HfrF1n7wJ/E6yldmRbHIVFcUYpHgmMqqirQDKZsrdlwJpjNyOyKc4K3jQynrHzeDPInaIgd8lSN2n00mX+nsYVKoIcM7o1+/b+3EM8haOySpU9IMSe8LumDS5N7BTGInbF1DtW6+q1ErP9ikm+9qnJRiPb9plu8yJRtlvqGtwdXoeLKFTQpxklpZVRbdDSHJqFeanri0DVpdrajcZBfkczXrpJ+YojIcGGvURTtTYWjMxIKlSwWe140g+Dvfkk5RGHXm8hay4ZVrye5TaWuKJNd3PjvtJKVdlMxv58bPz5xPOTc7XeOxxZxU27T/Hf0u979vpsA3sAZlmkZtKg1TD3o+xoua2mkTvvffoV9s7Yfc8DLIU4oy1RV1DdWqqasKqDQTLWidm3IgxcsAipQku8qDVNdUxqylJKrlc5rfaOo1M3K5mHJYFaqk745+PZLi9S45I9hLJXWk+hBjTKrVNFr9FCq2qndi72Ambk/YmbOnei9UVLJRZskZqW5srfW8n2UhTtJi7l2dNOp1dHfSPfgyrWrrpaLK52JgldOSrHKbojIM0zZVsWCp0AulIQjxc6jdnHvRVfmvTFGIM83JDqprqNasa6br7FuFXxfAr9h2gsnuUz8+OqDfamtKfmCS6zvX1/aiSxENTHGyX1Y31abd2zTWueF1G8XjFePq7O5P+tnp7sVtkQNXpos4nQi5lSnwDaxBmaZRm0p9ZY/kcRdGL4YGRyd8779DvzBbNwYt/jqSvA/ylBo3HaGLbqxzvZZBrsSyRqt7kl+jXgZQpOzaNamuqUyDPMkMy2c5pmWu770qpk7wQo1Qz45+TbXhZez5OX5/QNKAIYPYqt6Z5k4ncnvC+r2h3th+XcbtMzKNjicq5El6weVWUWEyadQrRaNl6fwarWpKvcy/l4oqn4uBJT0XU1SG4QhenWsyFiyFYaE05JfRuOoqjsnLHOqGSidommRJ+5V/rvjlhbkoXsEYmZT3qaF0gUqS6zvX13ZsJC1ipE3rWtK+t66hWrZ+mqdtFGO/d6rAOd29ONaZubL6SdfbFXqR6f4eWIMyTaM25c9I1gmVQ4mNfb9toebl06WA2w8NLXN0Y/t1gf7MxBHpWOdZOc6hTragbjJB/43is0ZTDaR4HenNpl2T6ppyvZVinM7xG/0VIu4+myhXiymHWTGuEnWFtfbWZA9Jh+fMn6EHPr9Ki2/ysFi4kV6s8t5z6vaE9XtDzUdF4efkzpWeiiTzd10K/oYyMZC7Ik2jZfO6lpSLjsUqKjcpQPlcDCzpuZiiMgxH8DoxWArHQmnIn3GtnfUVtdV83XXwYzSuldVPTX5h0ZoJ2STvabtOs+eFoZPIn3HZlPepmnSBSpLrO9fX9kVjZYz06IabXN0Xq26Z63o7xfjfO1XgnO5nxjozG6e9rrWzvhJ3XuWmDsl0fw+sQZmmUZtKXWWvGhb5z6DLJLGx77cttPLem/Sh1m8povSrGufK2o3v1r2fWhF4sJY4Ij0wxap3yuWizvLzI9lUx1SCbNMmrk2UaiDF60hvNh1bqa6pTIM8ydQuvsnZp96LhPtsMtkuphx2hQqoYyPQs1O8Hnv+TDY/pK6hWvf83s26c2NrxkEOY6Q7H2zVtUvnePoZmdLaEssTph4aLyd3LsSC4R9Pv6xBH1tonZhyWS9NvRRwUJ1i1CtNo6WtuV6PbFieNKjusgu0ZzzzYnKS8raadcpzat6ypJVoGILXxGApLCt95+dcLKVOAu+/y5wpb+hDcx/WDTM6XAQ/0ZVTowF447TXJ75sIlL7Zyb9jPZ//e5CnzqexM6zcVk9O30s6VaOkrRhxYLUH5Lk+s7VtR0r3+kqoyc+sVr33daY4QjH+3+pUd+fPnYlqE68nlL93qkC53SNx/jOzBtmdGj93IfVUHlAuTgR3N6nA2lQpqjH01q0RivvvSFv7YHExn42baHGDz2gX639b8pnPWmMdOfGVr2nzQmkgwrWYud7sukcP6q65LrzqRSkWlA3nVy2aeuuS74mcqq1iZINpHgZQJHi2zXeZKp/0g3yJLqSXdT+kHP/dCPFfTZRtosph12hAuqfRb8uTfF6LFcs1RxrT25oa9CHXC7e5evE8yBMPTRuT+5ciU/Z+9/TxzwFIzY6OrF7xiX9rNL/CLdXSUe9XPTE3X/bQm3/xGqtTtK423Jpg8ZdNuJynZ6Y8ZxKUonmM3hdsGxu5so1RbCUr9RNt6ykeSuvyelnTp06ruT/z94bUlaFShG8GuTeOesvtXbWlzVrSuZVhGfMlNY2PavfuObfT/hb3zCjQ+tbv62GRudTJ3I6vNZHA/CJL0Wk9VulJWsn/azG1lrdmabuC1tqZazu/ObMizowLXn9V1NVobvfc236D0q4vnN1bcfK998/caunFMOl82s0vXW2vjnzok4kGYFL9ntn6sROdQ9P7MxsnPa67q37Ez1Qt0lrar6m1dV/r+ZpP5A8jlx7uU8H1qD00RjOV3sgVWPfd1toyVo1fuSTunnmd+U3qJ4xU5o9P/noYaqAKYgBiHTTOU5UjqftfCol6RbUTScX53CsM+WBP1mddueeRMkGUrwMoMSsvN7jAoEu6p90gzzxIvHZRUvWSuu3ZK5H0txnk8lmMeWwM7YAGwFGt83qlrNt1vXxK30bY2ok/ULOHX6etfacj89/ecWKFStefnnymmVuFu968qUT+tyO19NuhB478dz2xMc72NmnXU+kX/kvdkMN4qTqPTyofd87lvd9qcdlnYZTdJRh+egU3X2hUpEMjTkrq3+ePqYD0y5f+X9vOD6iV/9PkrmSOeEsfBIL5CY01E1E2vi068pDcrZy6ezu1/DIJVVXVaituV5L33ha2rnZ1TYJB6f/rnYd+0DWe3a6Pqf2Pz6pbL2jy7Xz7Ydztif2NQtrdPuG69XYWpv2/GtomaOVS7vUuP93k/5fHTy/TrvO/l60XKkWrIn9x6U7z7wtdlM9f7ru+vV3q7G1Vgc7+/T89sOuj02mZeU83frBxaprqNbA3ud1sqNDYwO/0LnLc3VqrEVvXUrVcZe83MZIC+5eoD974ef6pZFKvevy5L9bpsWgZs+brnfeuuCrzdpQeUArq5+aEBgPjDXq5NjNeqfxfr19qVGXL4+rsqpC9dfN1NLV116th08fchb9Gx1yplYsab/SgTWh/j53TAtO/63q3vrO5AIsWuP0mGe4TtOdexdlNTXF/0/ddTO1/K4FujQ6PuFecv7sxazr0hmzp2r+4hodGzivfafP6swUq+MV4xnX9vjcr7Tqd9qvz/wDEq7vXFzb47Ka+ysL9OCvvTvzmxN0dvdr47Y9GrfOfruLLkU01RpdNJN/74iRtn9idcagPdU9/I7IAW2vfCTtNja9o8u1b/g+9Y1lnkfo9z6dsc67Z3H2ozNJ6vFJYo3hFRtdlc0rY6T1m29J+btk1RY6uksvPL5Hr765Uunr7nG1THtBtZW9qoyMaMHdv6q6f/Hrkty1B72W96pY3RzrJM18f4lvIzXVz9SxgXOTftbCsYhuH6nQwsuT1wlqaJmjpe+bP6leOtVz1uU9Kv5emXhvydWCcNH2VfTvOr9plqe/gRvpzuHYyPPAG5NDi1xce53d/dra0aU90e373NQ5V0Tblwd/sdR1m+LOje7rn8SyxVvdVKtN61om161HdzlbxR5/YfIHurzPpuL1+kvl1ltv1f79+/dHp/wWTEECakkyxjwrZyXvTdbav4h7/s8l/aGkv7bW/q7Pz04ZULvl68TzIJAbqkfJTu50DcRYOYcGRjLfZIz0s8ZKfffsxA3oF45FdM/lKlWPJD/4dGRcz0dT/RL/33sPD+rFp3+ut45PXiDMTaUpKfXvliQgSNb4yEq6imr2Qmnp3dJtn5TmLfN9g4jxfE4lKdvE4DW1ppvrNefaGTJyFge8OHr5yr/TVZppK9c0/1e9c/619r39K+o7Nfkzr6no0u3Nr0g336d9+2cn/f+bOn2KLl6YPOp3zcIavae9Qe+cvqDBN4ZlZSYHf7EyHB5U5ze7Uv4NKqZGdOni5IZt2r/L6UPSD74oHdihgbEFOnnxJo3Z6ao0F1RhRnTkwtqkjf74z3zypRP67I7XVXvpaqAyc1x61+UpSYPsmroqLbqxTje2X6e6hmpX9dSMWVNzGuR6liYAdyvZuTcwxeqH+/p0/shZVQxdUu3MqVq4ZHbSv3+mzxu9cEn7/rEnY0N81fom3XbP1VW6P/XUK/r2/swr13701gX64kdvdvW7Spp0PbnpmJrcvHY6ZKykhR9YoA/dmyrhLLN8dGKnuoffN+V5PVr5NUXS9RSZiAbavqIDb63Q8QMDGhqYvAR2Lu7TuWpQppRFYzi+bAN959T98mlPnWtuOxuybQv1vviKXvzHPr01MHnbpAn38RzVP146HGI/f+jyPBcdv9L4yrmqXjbH6XSfX5O2HXrntXP0aw11WlA9zdW503t4ULu2H9bZJOeyJFVUSrddu1vXDHek7FCaPW+6xkYv6/w7k+ewp7qPJhNUGzfd9ZXvay9+IOW9AzvVdug/y3jo3MrUpqi7bqbaPtri6/8w6SBPpqmrObjP5gsBtTNK/SNJ8yR9R9IhSavl7FF9RNId1toBn5+ddUAd4+vE8yDvN9QcyVROtzfFVP+fA33D+tmeN68ELpE5U/Xm3IjOV0Uy/r9nW2leeU9ftyp7O7Rg+B8mz5nOVzAgeaqo3Pyu75w+r3NnLmrmnKmaPW9GdudUQtl67fu070fjhesIyjR6ue+wxn5xVJXmvBY0jqvu1tsn/F+m+v/L1XWYeB7HB+C+f0aaRvHANb+mk/M+rrGZi1N+ZqpGWd1lo/fPqtGaxbVqvm5W2vJ4LnuIb76F4jdw+OvdP9eXn+9OuoJ3TVWF/v2dze5GppOJ+zv1DszTviPXq++Y+8by3MU1+qUPX5+Taz5fndhJ7znnXvYUaBbLfTqlHFyPngJJH/eCbP+PJxx/aUALKl9T3YyBvNU/ieWtqZ2mocHRq+Wf97bqhn8kDR6Vzv5CvaPv0b6jN6rv1IxJn5Xp/yuX7dCBvmG90nFCp46e1fhlq5raKi1fe52W3DLPeUP0XBk4PaaT/ddorHqJKuvf5apdlex5ScV97eSKz86tdG0KOMo+oJYkY0yjpC9I+mVJdXJSvZ+W9KfW2uS7lLv73JwF1PCm6BseEsGACyXxdy42WZ6X+e4chDt+r53v//RN7dh/UkMjl1RTVaENKxZknjOdw/IFdc0Hep5S13uWMZDkXpAW984yR52TcwTUeURADQAAAAClKywBdVHvQw0AAAAAQKEQUAMAAAAA4AMBNQAAAAAAPhBQAwAAAADgAwE1AAAAAAA+lOoq3wPTp0+vXbaMpegBAAAAoNQcOnRIFy5cGLTW1hWyHKUaUI9KmiLp1UKXBchSa/Tr4YKWAsgO5zFKBecySgHnMUrFzZIuW2unFbIQFYX84Xl0QJIKvScZkC1jzMsS5zKKG+cxSgXnMkoB5zFKRexcLjTmUAMAAAAA4AMBNQAAAAAAPhBQAwAAAADgAwE1AAAAAAA+EFADAAAAAOBDSW6bBQAAAABAvjFCDQAAAACADwTUAAAAAAD4QEANAAAAAIAPBNQAAAAAAPhAQA0AAAAAgA8E1AAAAAAA+EBADQAAAACADwTUAAAAAAD4UFIBtTFmgTHm68aYPmPMqDHmmDHmS8aYuYUuGxBjjKkzxnzSGPO0MabbGHPBGPOOMeYFY8wnjDFJr0tjzB3GmGeMMYPRY14zxvyBMWZK0L8DkIox5kFjjI0+PpniPb9qjNkVPe+HjTF7jDG/GXRZgUTGmHXRuvnNaDuizxjzrDHmg0neS52MUDLG3GOM+b4x5mT03DxqjPmmMeb2FO/nXEZBGGM+Yoz5C2PMD40xZ6NthycyHOP5fM13u8NYa3P1WQVljLle0o8kzZP0HUmHJa2SdKekn0lqs9YOFK6EgMMY87uS/krSLyQ9L+mEpPmSNkiaLenbkj5q4y5OY8yvRZ8fkfSkpEFJ6yW9W9K3rLUfDfJ3AJIxxjRKel3SFEnVkn7bWvu1hPf8e0l/IWlAzrl8UdJHJC2Q9GfW2k8HWmggyhjzmKTPSDop6Z8k9Uu6RtKtkv6PtfahuPdSJyOUjDH/XdJDcurYf5BzHjdL+pCkCkkfs9Y+Efd+zmUUjDHmFUk3SxqWU/e2Svp7a+2DKd7v+XwNpN1hrS2Jh6RnJVlJv5/w/J9Hn/9qocvIg4e1VpLuil78kYTnr5UTXFtJ/yru+VmSTksalbQy7vkqOZ1IVtIDhf69eJT3Q5KR9H8k/VzSF6Pn5ScT3rM4ehMckLQ47vm5krqjx9xe6N+FR/k9JP129Pz7O0lTk7xeGfdv6mQeoXxE2xGXJb0paV7Ca3dGz82jcc9xLvMo6CN6XrZE2xBro+fcEyne6/l8DardURIp39HR6bslHZP0lwkv/ydJ5yRtNMbMDLhowCTW2uestTutteMJz78p6avRb9fGvfQROaMk37DW7ot7/4ikP45++2/zV2LAlU1yOos+LqfOTebfSJom6cvW2mOxJ621b0v6b9FvfzePZQQmMcZMk/Rf5XRo/l/W2ouJ77HWjsV9S52MsFokZzrnHmvt6fgXrLXPSxqSc+7GcC6joKy1z1tru2w0ys3Az/kaSLujJAJqOb0bkvT9JEHKkKROSTMkvS/oggEexRptl+Keuyv69Z+TvP8Hks5LuiPaKAQCZ4xZJulRSVustT9I89Z05/I/JbwHCMq/lNNI2yFpPDr/9I+MMZtTzDmlTkZYdclJZ11ljKmPf8EY835JNXIyiWI4l1FM/JyvgbQ7SiWgfnf065EUr3dFvy4NoCyAL8aYCkkfi34bf+GnPL+ttZck9ciZF7UkrwUEkoiet9vljO793xnenu5c/oWcke0FxpgZOS0kkN5t0a8jkn4i6R/ldBB9SdKPjDG7jTHxo3rUyQgla+2gpD+Ssy7LQWPM/zTGPGKMeUrS9yX9b0m/E3cI5zKKiZ/zNZB2R6kE1LOjX99J8Xrs+Tn5Lwrg26OSbpT0jLX22bjnOb8RZp+X9F5Jv2WtvZDhvW7P5dkpXgfyYV7062fkzKf7JTkjeTfJCULeL+mbce+nTkZoWWu/JGeR0wo5awN8VtJHJfVK+ruEVHDOZRQTP+drIO2OUgmogaJmjNkk6VNyVqffWODiAK4YY1bLGZX+M2vti4UuD+BTrC10SdKHrLUvWGuHrbWvS7pXzsqz7am2HALCxBjzkKRvyVlg73pJM+WsVH9U0t9HV7MHkEOlElBn6l2IPX8m/0UBvIku579F0kFJd0ZTtuJxfiN0oqnej8tJo/oTl4e5PZdT9SQD+XAm+vUn8YvWSJK19rycXUQkZytOiToZIWWMWSvpv0v6rrX2P1hrj1prz1tr98vpHHpD0qeMMbGUWM5lFBM/52sg7Y5SCah/Fv2aao50S/RrqjnWQEEYY/5Azt54B+QE028meVvK8zsa1DTJGVk5mqdiAslUyzknl0kaMcbY2EPO7gqS9DfR574U/T7dufwuOSMpJ6NBDBCU2Hl5JsXrb0e/Tk94P3UywuZXo1+fT3whWq/uldP2f2/0ac5lFBM/52sg7Y5SCahjFcfdxpgJv5MxpkZSm5yV334cdMGAVIwxfyTpf0h6RU4wfTrFW5+Lfv3lJK+9X84K9j+y1o7mvJBAaqOStqV4/CT6nhei38fSwdOdy7+S8B4gKB1y5k7fkNiGiLox+rUn+pU6GWEVW934mhSvx56PbQ3HuYxi4ud8DabdUegNvXP1kJOSZSX9fsLzfx59/quFLiMPHrGHnBRZK2mfpNoM750l6S152MieB49CPiQ9HD0vP5nwfJOclZQHJC2Oe36upO7oMbcXuvw8yu8h6TvR8+8PE56/W9K4nFHq2dHnqJN5hPIh6b7o+fempOsSXvuV6Ll8QVJd9DnOZR6heUhaGz3nnkjxuufzNah2h4l+aNEzxlwv5z9znpwb4yFJq+XsUX1E0h3W2oHClRBwGGN+U85iIZflpHsnm7dxzFr7d3HHfFjOIiMjkr4haVDSh+RsB/AtSffZUrmYUfSMMQ/LSfv+bWvt1xJe+31JW+Xc3J6UM1LyEUkL5Cxu9ulgSwtIxpgFctoQjXJGrH8ipyH2YV1tpH077v0fFnUyQiaaYfGspH8haUjS03KC62Vy0sGNpD+w1m6JO+bD4lxGgUTPvw9Hv71W0gfkpGz/MPpcf3y7wM/5GkS7o2QCakkyxjRK+oKcYf06Sb+QU5n8qbX27XTHAkGJCzbS2W2tXZtwXJuk/yjpdjm9cd2Svi5pq7X2cu5LCviTLqCOvr5e0qclrZAz9eigpC9ba//fIMsJxIvuNf15OY2zd0k6K6dR94i1dm+S91MnI3SMMZWS/p2kByTdICcNdlDO/Omt1trvJzmGcxkF4aJNfNxauzjhGM/na77bHSUVUAMAAAAAEJRSWZQMAAAAAIBAEVADAAAAAOADATUAAAAAAD4QUAMAAAAA4AMBNQAAAAAAPhBQAwAAAADgAwE1AAAAAAA+EFADAAAAAOADATUAAAAAAD4QUAMAAAAA4AMBNQAAAAAAPhBQAwAAAADgAwE1AAAAAAA+EFADAAAAAOADATUAAAAAAD4QUAMAAAAA4MP/D7xPZVdV/aSBAAAAAElFTkSuQmCC)



We now know enough NumPy to be able to write a function that computes
running average (a.k.a. "mean filter"). Let's try it out in a plot
immediately.

<div class="input-prompt">In[52]:</div>

```python
def running_avg(x):
    return np.cumsum(x) / np.arange(1, x.size + 1)

# example plot:
for row in somevectors.itertuples():
    plt.plot(row.vectime, running_avg(row.vecvalue))
plt.xlim(0,100)
plt.show()
```

<div class="output-prompt">Out[52]:</div>


![png](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA+cAAAGECAYAAABUAVFhAAAAOXRFWHRTb2Z0d2FyZQBNYXRwbG90bGliIHZlcnNpb24zLjMuMiwgaHR0cHM6Ly9tYXRwbG90bGliLm9yZy8vihELAAAACXBIWXMAABYlAAAWJQFJUiTwAACO9UlEQVR4nOzdd3zcd2H/8dfnhvbelrz3tmM7cfbekBAgjLLpgpYCpYT2x2gbaGmhUGYptGWWnTIySEJC9h52Ysd7b9nae5xufH5/fE+nO+lO0kkn3cl+Px8PPb77+/2cLEv3vs8y1lpEREREREREJH1c6S6AiIiIiIiIyLlO4VxEREREREQkzRTORURERERERNJM4VxEREREREQkzRTORURERERERNJM4VxEREREREQkzRTORURERERERNJM4VxEREREREQkzRTORURERERERNJM4VxEREREREQkzRTORURERERERNJM4VxEREREREQkzTzpLkCmM8YcAYqAo2kuioiIiIiIiKTefKDTWrsgnYVQOB9bUW5ubtmKFSvK0l0QERERERERSa09e/bQ19eX7mKkJpwbY24HrgDWA+uAQuCn1tp3JXGP9wE/GOO0kLXWHXXNfODIKOf/0lr79vGWIYGjK1asKNu6deskbyMiIiIiIiKZZuPGjbzyyitH012OVNWcfwYnlHcDJ4HlE7jHNuCzCY5dBlwNPJjg+Hbg7jj7d06gHCIiIiIiIiLTKlXh/GM4ofwgTg3648newFq7DSegj2CMeT68+t8JLt9mrb0z2WeKiIiIiIiIZIKUhHNrbSSMG2NSccsIY8wa4ELgFHB/Sm8uIiIiIiIikgFmwoBwfx5efs9aG0xwTq0x5gNAOdACPG+tfW1aSiciIiIiIiIySRkdzo0xucC7gCDw3VFOvS78FX3tE8B7rbXHp6yAIiIiIiIiIimQ0eEceCtQAtxvrT0R53gv8E84g8EdDu9bC9wJXAU8aoxZb63tGetBxphEw7FPZHA7ERERERERkXFzpbsAYxhs0v5f8Q5aaxuttf9grX3FWtse/noKuB54EVgM/Ok0lVVERERERERkQjK25twYswq4GGcU+AeSudZaGzDGfBfYDFwOfH0c12xMUI6twIZkni8iIiIiIiKSjEyuOR/PQHCjaQov81NUHhEREREREZEpkZHh3BiTA7wbZyC4703wNheGl4dHPUtEREREREQkzaY9nBtjvMaY5caYRaOc9hagFHgwwUBwg/faYIwZ8RqMMdcAHwtv/mRSBRYRERERERGZYinpc26MuQ24LbxZE15eZIz5YXi92Vp7R3i9DtgDHAPmJ7jlYJP2/x7j0V8BlhhjnsPpmw7OaO1Xh9f/3lr73NivQEREUsXX66e7zUfprHxcLjOlzwoMBLGAN8s9pc8RERERmWqpGhBuPfDeYfsWhr/ACeJ3MA7GmBXApYxvILgfA28EzgduArxAA3AX8B/W2qfH80wREUmNA1saePwne/H3B8nO9zB3RRlzV5cze1kpA/1BOpr66GjsxZPlZsXFs3B7JtaA68hrzWz7w3HOHOrA5XVx5TuWsWxzzdgXioiIiGQoY61NdxkymjFm64YNGzZs3ZpoGnQREQE4vruF331zO8n8WVl+UQ0djX1k5XlYc+VsZi8vpafdR35xdsLgfnBrIw/9z84R+y+5fTHrr5070eKLiIjIOWrjxo288sorrySawWu6ZOxUaiIiMnO0N/Ty8Hd3JRXMAfY+fyayfmxHS2Td5TGU1xZQObcw8pWd66H+QDtP/XJ/3Hs99+uDlNcVMGdF2YReg4iIiEg6KZyLiMikBAMhHvyvHfh6AwDkl2Tzlk9uoq9rgGM7Wzi+q5XGY53kFmRRXJXLyb1tY94zFLA0He+i6XhXwnNKqvO46QNrePwnezlzuANr4eHv7eL6P15FYXkOecVZZOXoz5yIiIjMDHrXIiIik/Lqw8dore8BwON1cfNfrCG/OJv84mwqZhey8cb5Mee3N/ay/ZETuDyGkqo8iitzObK9mV3P1GND46t6zynw8vq/WktxZR43fmA1d33+ZXo7B+jv9nPvN7ZFzvPmuMNlySIvvMwvySavOIvKOYWU1uSn6tsgIiIiMikK5yIiMmGtp3vY8sCxyPaFty2ial7RqNeUVOVxxTuWxeybu6qc826YS2dTH7MWl+D3BWk60RWpPW861oXfF6RiTgHVC4pZdVkt+cXZAOQXZ3PDn63i7q9uGxHu/f1B2vt7aW/oHVkQAzd/cA0L1lVO8NWLiIiIpI7CuYiIJC0YCPH0L/ez59nThMKBuGpeIWuumj3hexaV51JUnguA2+NizvIy5iwfX//x2iWl3PwXa9j7/Bl62n30dvroaR8gGAglvsjCU7/cz5wVZXg0FZuIiIikmcK5iIgAcOjVRlrre5i1uIRZi4oTjpZureXJn+9jz7OnI/tcLsOV71w+5fOaj2b+mgrmr6mIbFtr8fUG6Onw0ds+QE+HL/w1wP6XzuDrCdDd6uO+b26npDoPb46brBwPWeGlN8dNVq4nsi/6uMs9sSngRERERBJROBcROcf1dg7w8u+OsPOpU5F93hw3c5aXOVObdfg4c7iTttM9zF9TTl5xdkwwn7WomM23LqRybmE6ip+QMYacfC85+V7Ka2OPlc3K58mf7QOg/kA79Qfak7q3x+vCmzsU5LNy3BSU5rD+urlUzC5I0SsQERGRc4nCuYjIOaqrtZ9XHz7O7mfrCfpjm3/7+4Mc3tbE4W1NMft3R4VygGWba7jmfSswJn015hOx8tJa9j5/moYjnRO6PuAPEfAP0Dfs8sPbm7jtY+eN2e9eREREZDiFcxGRc0x7Qy9bHzrG/hfORPqLR8styqKvc2DM+8xaXMxV71o+44I5OM3w3/Cx8zh9sJ3+Hj8DfUEG+gP4+53lQH8Qf18gsj7QH8TfH2CgL8CALwgJBpX39we59xvbeOPfbKC8TjXoIiIiMn4K5yIi55CGI5385t+3EgrEpsvKuYVsumk+C9ZVgHEC/LGdLTQc7SS/KJuaRcUE/EGe/uUBBvoCzFpczM1/sRa3d+b2vfZmuZm7sjzp62zI4h8IxgT5nnYfj/14D76eAL6eAPd+fRsXv3kxvl4/PeH+7r2dA5RW53HRGxdpADoREREZQeFcROQcsveF0zHBfNbiYjbdNJ85K8tiasBLa/LjzgG+YF0l7Q29VM0txKRx8Ld0Mi4T7mfuIZ/syP78kmzu+dqr+PuD9HYO8MgPdo+49sTuVny9Aa59/8rpLLKIiIjMADO3ykNERJJ2YndrZP3a96/kTXdsZO6q8nE3Tc/O9VA9v+icDeajqZ5fxOs/NHZrgn0vnqHx2MT6uouIiMjZSzXnIiLniM7mPjqa+gDwZLlYvKEqzSU6+9QuKeWWD6/jld8fw+VxkV+STX5xFvnF2bxwzyH6uvwAvPb4SS5/+1KycvRnWERERBx6VyAico44sWeo1rx2ScmM7i+eyeqWllK3tHTE/qLKXO756qsA7HvhDPtfPENZXQGzFhaz9urZcbsRiIiIyLlD78xERM4RR19rjqzPWVGWxpKcm+qWlFBSnRfZthZaTnaz86lT3PWvW2it70lj6URERCTdFM5FRM4BTce7OLqjJbI9b3Xyo5TL5BiX4XV/uZbVV9RRPruA6G7+AV+Q3//3Dgb6A+kroIiIiKSVmrWLiJwDXrzvcGR94XmVakKdJiXVeVzxR8sAGOgPcGpfGw9/dxcBf4i2M73c9fmXWX7RLHx9AToae+lo6iMUtKy/dg5V84ro6x6gv8dPf7efvm4/vm4/GMP6a+dQVJGb5lcnIiIik6FwLiJyljtzuINjg7XmBi64ZUF6CyQAZOV4WLCukivftTwy7VpHUx8v3nt4xLlP/HTfqPdqre/mtr/ZMCXlFBERkemhZu0iIme56LC39PxqymsL0lgaGW7Z5houfcsSsnIn/nn5qf3tNB3vSmGpREREZLqp5lxE5Cx2cl8bJ/e2AU6f5/Nfr1rzTLTumjmsuGQW+188Q9PJbgpKsimuysXlcvHKQ8fo7Rwgp8BLTr6X3AJvZH3LA0cj97j/P1/jzX+7kcBAkNb6Hrw5bmYvK8Xl1ufwIiIiM4HCuYjIWcpay4v3DNWar7iohpKqvFGukHTKyvGw+orZI/Yv3ph4PvqlF1Tzqy9uZaAvQE+7j//91HMxx4src7n0rUuYv6Yi5eUVERGR1NLH6SIiZ6n6A+2cOdwBgMtj2PQ61ZqfbUpr8rnxz1ZjXCbu8Y6mPh749o7Iz4GIiIhkLtWci4icpQ5saYysL79oFoVlOWksjUyVOSvLuPIdy3jiZ/uwIUt+cRZltfk0HuvC1xvAhiwPfXcnyy+chdtjcLlduD0uZ93jwu0eXLpweczQ0uOc53Kb2GX0OW5Xwg8GREREJDkK5yIiZ6FQyHJ4W1Nke9kFNWksjUy1lZfWsnB9JRjIyfcC0NnSx12ffxlfb4DuVl9M//RUcrlMJMyPDPIuispzuPC2RZTN0vR9IiIio1E4FxE5C5051E5f5wAAuUVZ1CwqTnOJZKrlFHhjtovKc7nqXcv5/X/vnNLnhkKW0IAlMBCKe7zlZDeeLDfX/8mqKS2HiIjITKdwLiJyFjr4ylCt+aL1lbjU9PictGhDFbd97DzOHOkgFLQEAyFCAWcZDFpCgRDB4NC+wXOi10deF14PL8ej7UwPB7Y0cOZwBwWlOdQtLaFiTqF+LkVERKIonIuInEWCwRCv/P4Yu546Fdm3aENlGksk6Va3rJS6ZaVTcm9rrVNzHhgZ6k/ubePJn+0DoPlENw9/d1fMtdl5Hq54xzKWbKqekrKJiIjMNArnIiJnieaTXTz6oz00n+iO7CupzqN2SUn6CiVnNWMMbrfB7QZvtjvmWF5RFlseOEpPuy/utb7eAC/ec1jhXEREJEzhXERkhrPWsvXBo7z8u6OEQkPNjGsWFnHt+1ficmvWTJl+WTke3v6ZC9j9bD0HtjRgQzB3VRndbT4OvNwAOFO9fe/jT+P2upwvjwuP1xlJfnDb7XGOeTwuXOHl4L7o5dB1brJy3dQuKcHjdY9RShERkcyRknBujLkduAJYD6wDCoGfWmvfleR9jgLzEhxusNbGHW7YGHMx8BngQiAXOAB8H/imtTaYTBlERGaaPc+d5sV7j0S23V4Xm29dyLpr5qhPr6RVToGXDTfMY8MNQ3/arbUc29HMQL/z57m/xz8lz65dUsKtH1mP26sPp0REZGZIVc35Z3BCeTdwElg+iXt1AF+Ls787zj6MMW8Afg30A78EWoFbgK8ClwBvmURZREQy3t7nT0fWqxcUcc17V1Bao2mrJDMZYzj/9Qt48Z7DBPzxR3hPhfoD7Tzyw93MX1uReJ726Pndo84ZPM/lMhijD7hERGR6pCqcfwwnlB/EqUF/fBL3arfW3jmeE40xRcD/AEHgSmvtlvD+vwceA243xrzdWvuLSZRHRCRj9XUPcOZQh7Nh4Oa/WEteUVZ6CyUyhvXXzmXNVbMJDoQI+J2B5IKDy/B6IM6+YMDG7BtxrT9EX9cAJ/a0AXBwayMHtzZOqqyDYT5usA8H+qxcD8svqmHp+XEb+ImIiIxLSsK5tTYSxqf5E+bbgUrgfweDebg8/caYzwCPAn8BKJyLyFnp2M4WbLibec2CIgVzmTHcbhfuXBdZuam9r7WWR364m/0vNqTkfqGAJRQI4veN3kvuxO5W6g90cNlbl+D2qCm9iIgkLxMHhMs2xrwLmAv0AK8BTyXoO351ePn7OMeeAnqBi40x2dba+MPFiojMYEe3N0fW56+tSGNJRDKDMYar37WCsln5tDf0EgxYQkGn1n34vO6Rud6Hz+vud47Z0PjmcR+066lTnNjdQkl1PgVl2RSUZFNQmk1xZS41i0o0BoSIiIwqE8N5DfDjYfuOGGPeb619ctj+ZeHl/uE3sdYGjDFHgFXAQmDPaA81xmxNcGgy/edFRKZMwB/k+O7WyPaCtZrPXAScQRE33jh/0vcJhZxgHwpYgsEQQf9g0B8K88GAZcfjJziwxWk+39ncT2dz/4h7LTm/muv/ZNWkyyQiImevTAvnPwCeBnYBXTih+q+APwceNMZcZK3dHnV+cXjZkeB+g/tLUl9UEZH0Or6rNdLUtqgyl9JZeWkukcjZxeUyuFxu8I5+Xs3CIirmFPLS744QTDDI3YGXG1i2uYa5K8swqkEXEZE4MiqcW2s/O2zXTuCDxphu4OPAncAbp+jZG+PtD9eob5iKZ4qITEb0QFeLN1RpVGmRNDHGsOGGeay6vI6Oxl6623x0t/noae/n+O5Wmk84E8787j+2k53vYcP1sdPLiYiIAMyUEUu+E15ePmz/YM14MfEN7m9PdYFERNIpMBDk6GtD/c0Xb6pKY2lEBCA710PVvCIWrq9k7VWzueiNi7n2fStjasp9PQGe/+0hOpv7ku7TLiIiZ7eMqjkfRVN4OXzi3n3AJmApENNn3BjjARYAAeDwVBdQRGQ6HdvVEmnSXlyVS8XsgjSXSETiKa8r4PUfWsue509zcMtQa5cff+Z5AIzL4B6cZ93jiqwPfUUfS7DtdpGV62Hp5mqKylM8/L2IiEybmRLOLwwvh4fsx4B3AjcCPx927HIgD2ekd43ULiJnlegm7Us2VatJu0gGm7uqnLmrynF7drPvhTMxx2zIEhiwBAbi91VPxp7n6nn7P2zGm+We9L0klt8X5PC2Jrpa+6mYXUBJVR4dzX20n+mlo7mPvKIsZi8rpWp+kUblF5EJm/ZwbozxAosAv7X2UNT+FcBxa23PsPPnA/8R3vzJsNv9Cvgi8HZjzDcH5zo3xuQA/xw+59spfxEiImnk9w1r0r5RTdpFZoLzrp9L2+meyBRvwcDkA3m0zuZ+fvWFLeQWZuFyG1wug3GZ+OvhZaJ1E952ueOsj3Fvl9sQ9FuaTnTReKyL9oZeXG6DJ8tFV0s/pbPyqV1czNLNNRld02+tpeFIJ3uerefA1kb8/aPPdf8iUFiew/pr57Di4lq82fqQRESSk5Jwboy5DbgtvFkTXl5kjPlheL3ZWntHeL0OZ1qzY8D8qNu8Dfi4Meap8LEunBD/OiAHeAD4cvRzrbWdxpg/wwnpTxhjfgG0ArfiTLP2K+CXqXiNIiKZ4tjOlkgtW2lNHmW1w3v8iEgmKq8t4C2fPD+yba0dml99cO71yFd42jZ/KDIn++B6ZBq38HZbQy+7n64HoLW+B+hJUILM0N3m48TuVl556DjX/+kq5q+pSHeRYgz0B9j55Cn2PHea9obepK7taunn6V8e4KXfHWHBmgqy87x4c91k53rIyvGQleshK8dNVq6Hkuo8cvLHmApARM4pqao5Xw+8d9i+heEvcML2HYzucZxAfR5wCU7/8nbgGZx5z39srR0xcoq19m5jzBXAp4E34wT5g8DfAN+Id42IyEx2bGdsrbmatIvMTMYM9TefDBuydDb1cXJvW4pKNj38viD3f+s1XC5DWV0+xZW5zF5exrLNNWmrdfb7gvzmS6/Qcqp7xLGS6jzqlpbQeKyL3g6fM4VljVPutjM9HH2thf4eP+AM/Ld3WBeG4Vwew4qLa9lww9yMbkEgItMnJeHcWnsnzjRn4zn3KDDinaS19kngyQk+/1ng5olcKyIy0/T3BCLrFXMK01gSEckExmV4/YfX0XKyG78vSChksUHrLEPOMhSMsx59Trz18DLh+oh7hiLrAKU1+VTOLaSrpZ/eDh81i4qpXlBM88kuXrr3CF2t/QCEQpbmE900n+jm0CtN7H/pDG+6I+4Mt1PKWsvjP9kbE8y9OW6WbKxixSW1VC8oGvXDUP9AkL3PnWbbI8fpbO4f83mhgGXXU6fY80w9pbX5zF1RRkdTH12t/SzaUMl5189T/3WRc8xMGRBORETCgv6hfo8e70yZEVNEppLb7aJqXlG6izEuFbMLmLuynJ/d+QK+3sCI46cPdnD3V18lK8eN2+vC43Hh8o4cwT7yNXjMO7S/bFY+RRXjr4329QV4+hf7OfByQ2TfhbctZO1Vc8Zdi+/NcrPmytmsuqyWU/va6WrrZ6AvgK8vgL8viK8/wECf89XT7qPtjNNkPhSytJzspuXk0IcCTce72PdiA+e/bj6LN1TFTMcnImcvhXMRkRkm4B8aRMqTpXAuIjNPXlEWb/jr89jy4FEKS3OYs6qM331ze+T4qX2TbKJv4A0fXc/s5WVjntrT7uO+b26PqTFfeVktG2+cP6FHu9wu5qwc/bnWWk7ua+Pl+45w+lBH3HPaTvfw8Hd38VTBfkqq8iiuymXO8lKWXlCjsC5yllI4FxGZYYJR4dzt0WjAIjIzVc4t5KYPrIlsr79uLtv+cDw1N7dwz9e2seKSWWRle/Dmup0B2XKcpTfHTWAgxJlDHRx8pZGe9qFZdxdtqOSyty5JTTkSMMYwZ3kZs5eVsuOJU9QfaKO4MpfiqjxO7m3j6GvN+H1OK6n+bj9nujs4c7iDfS+c4eiOFq5613KycvU2XuRso//VIiIzjGrOReRsdMmbF7P8whp6OweGRqmPGr0+Zp8/an/UeR2NfTQd74rcc8+zp8f9fOMyXPWuZay4uHYqXl78ZxrD2qtms/aq2ZF9Ky+ppb/bz7ZHj7PjiVMM9MU2/T+4tZGDWxspKMtm1qISLnnzYvJLsqetzCIydRTORURmEF9fgI7Gvsi2puERkbNJeV0B5XWTu8ejP9rN3udHHyl9uOw8D9f98SrmrS6f3MNTJKfAy4VvWMQFtyyku62fjqY+Dm5pZPcz9ZFzult9HGht4PiuFq74o2W4PAa32xW1dPrnu9wJlh4X7vDc9Zr1QyQzKJyLiMwgR7Y1EQw4NecVcwpUWyIiMsxV71rO8otm0dsxwEB/gIH+IAP9Afzh5UBfEL8vgA1ZKucWMWtxMbVLSsjKyby3xS6Xoag8l6LyXOYsL6N6QRHbHjlB2+mhuex9vQEe/t6uCT8jK8fNFe9YxtILalJRZBGZhMz7LSQiIgkd2DI0kvCSTdVpLImISGZyuV3ULS1NdzGmxMpLall5SS2dzX38+DPPp+SeA/1BHv3fPbSd6aWsNp+6paXkFWWl5N4ikhyFcxGRGaKva4ATe4ZGMF5yvsK5iMi5qKgil1s+vI5DrzY5/e+DIUIBG146ffFDwZHLUNDpoz+4DPpDWOvMub7lgaMAuD0uVl5ay4Yb5lJQmpPeFypyjlE4FxGZIQ690ogNWQBmLSqmsExvmkREzlVzV5Uzd9Xk+sh3NPXx6y9tpa9zILIvGAix44mT7HrmFLOXlbH0gmqWXlCtfuki00DhXERkhtj/clSTdtWai4jIJBVX5vLOOzdz6NUm2k73cGp/e2S0+1DAcnxXC8d3tbDn2XoufOMiKmcX0tc9QEt9D+1neskrzmLxxioFd5EUUTgXEZkBulr7OX2wAwBjYNGGqjSXSEREzgbZeV5WXuJMH2et5fjuVrbcf4Qzhzsj55za386vv7g17vW+Hj+rr5iNr9eP2+PCk+UGIDAQpLO5n662fvKLszDG0N7QS3tjL8ZlWLiukpLqvKl/gSIziMK5iMgMcHBrY2R99nIN1iMiIqlnjGHeqnLmrSqns7mPHU+cZPtjJyNdquJ58uf7efmBo/R2DGAMFFXm4u8P0hvVVD6e5397iJWX1nLhrQsJhSy9HQPkFWeRW5iFy6WaeDk3KZyLiMwAx3Y2R9YXa5R2ERGZYkUVuVxy+xKWbq7h1YeO0XC0k87mfrLzPBRV5EaavwP0djhB3FroaOwb3wMs7H66nt1P18fsdrkMJTV5XPfHK6mYXZiy1yMyEyici4hkuIH+QKRJO8C81ZMbAEhERGS8KucUcv2frgYg6A/h8hiMMex/6Qx/+P7uyHkujyEUtBCuZDcuQ2FZNsYY+nv8ZOd5KKnOo6gil7YzvZza1xbvcYRCltb6Hn75zy+z9IJqsvO8ZOW6yc71Uru0hOr5RVP+mkXSReFcRCTDndzb5rzhASrmFJBfnJ3mEomIyLnI7XVF1pdeUENBWQ4djb1UzC6krC6fUNDS0dhLVo6HgtJsXG5Xwnsd3dHMM/93gI7GPoyBkuo8utt9+PuDkXP2v9Qw4rpL37KEOSvKyMp1k5XjwZvtxqgZvJwlFM5FRDLc8d2tkfW5K1VrLiIimaF2cQm1i0si2243426KPn9NBXNWlHHmUAfFVXkUlDofPL947+HInOvxPPN/B0bsK6/L58LbFjF/TUVS5RfJNArnIiIZzFpnKptBc1eVpbE0IiIiqeP2uKhbVhqz74JbFrBwfSVdrf0M9AXw9QZoOdXNnudOJ7xPy6ke7v/Wa5RU5+H2unC5DC63weUymPC6ccVuxzvmchlM+FhpTR6LNlSRk++d6m+DSITCuYhIBmtv6KWrpR8Ab46bmoXFaS6RiIjI1DHGUDm3kMq5sTXwC9ZVsPOpU/T3BPD3BxjoCzDQH8TvG2oG397Qm9KyPPXL/SxcV8mSTdXULCrWTCky5RTORUQy2PFdQ03aZy8rxe1J3H9PRETkbLVgXSUL1lWO2N/XNcBzvz3E3udPRwajS5VQwHJwa2NkOtOC0mwq5hRGPjyonFNIfokzh7tIKiici4hksOgm7RqlXUREJFZuYRbXvGcFF79xEb2dA4RCFhuyhILWWR9chpxlKDj2ur8/yJHtTTQe64p5Vnebj+42H0dfa456vpfq+UXMXl7G7OWllNXmK6zLhCmci4hkqMBAkFMH2iPbc1aqv7mIiEg8uYVZ5Bamrtn5ppvn03Kqm/0vN1C/v42mE90E/aER5/V1+Tm6o4WjO5wP0/OKsqhZVEx+URY5hVkUluWw6LxKsnIVu2Rs+ikREclQpw60R94IlNbkUVSem+YSiYiInDvK6wq4qK4AgFAwRNuZXppOdNF03PlqPtEd0+cdoLdzgMOvNsXse/ZXB1h79RxKqnMxxpkn3rgIrztzwkfWo4+5gHjnGxO+ZuT5xhgw4HIZAgMh2s700Haml47mPkqr81hzxeyYKfEksyici4hkqKZjnZH1OStUay4iIpIuLreL8roCyusKWH7hLABsyNLe2Mup/e2c3NPKyX1t+HoDI6719QZ4+XdHprvIcb103xGufNcyDE6IH2yCbwzOdmS/s9Pg7HfOMSPOG7zH4HkmshJ1PiPvHWn6H297lPMgqgzG4Pa4zqqB+hTORUQyVF+3P7JeWJ6TxpKIiIjIcMZlKK3Jp7Qmn9WX1xEKWZpPdNHe0Etfl5/ergEObm2ks6kv3UWN8PuC/OF7u9NdjJSqXVLCFe9YRl5RVmyLgsFwP6zVQSZTOBcRyVD9PUPhPDtP86yKiIhkMpfLUDWviKp5RZF9F9yygAMvNXBybxuhYAhrnRp3a8FaG7U9bD3kHMfiDGhngfA5oZCNrEfuFX2P8PXGBcWVeZTV5HHw1Sb6OgfS982ZQvUH2vn5Z18c9/nxQnvzie4pLOH4KZyLiGSo/u6hpnE5BQrnIiIiM43b7WL5RbNYftGstJZj822L2HL/EXrafc6Mc06+BwaDf/jDABj6IGDYeUR9oBA5D+eDAGd78ECc86LuHfuckc+NOc+GZ8gb3B8CG9kJPR0D2FByc+hF7h0KFza67GmmcC4ikqGia85z8hXORUREZGKycz1ccvuSdBcj5c4c7uC5Xx+k9UyPE+SHt0oIh/DoDwsymcK5iEiG8sWEc/26FhEREYlWs7CYN31i47jPTxTav/diASeax75+qqVkHH1jzO3GmG8aY542xnQaY6wx5idJ3qPcGPOnxpjfGmMOGmP6jDEdxphnjDF/YowZUVZjzPzwsxJ9/SIVr09EJB1Ucy4iIiKSOsYYXC6D2+3C7XXhyXLjzXZjXJkxUFyqqmI+A6wDuoGTwPIJ3OMtwLeB08DjwHGgGngT8F3gJmPMW2z8DgHbgbvj7N85gXKIiKRdKGTx9Q31Oc/OU825iIiIyNksVe/2PoYTyg8CV+CE62TtB24F7rd2cFgBMMZ8CngJeDNOUP91nGu3WWvvnMAzRUQykq/XHxnsJDvPg8udkoZOIiIiIpKhUvJuz1r7uLX2QIJa7fHe4zFr7X3RwTy8/wzwnfDmlZMopojIjNHd5ous5xVlpbEkIiIiIjIdZko7ycGOl4EEx2uNMR8AyoEW4Hlr7WvTUjIRkSkQHc4LynLSWBIRERERmQ4ZH86NMR7gPeHN3yc47brwV/R1TwDvtdYen7rSiYhMje7W/sh6QWl2GksiIiIiItMh48M58AVgNfCAtfahYcd6gX/CGQzucHjfWuBO4CrgUWPMemttz1gPMcZsTXBoIoPbiYhMSkzNealqzkVERETOdhk9wpAx5iPAx4G9wLuHH7fWNlpr/8Fa+4q1tj389RRwPfAisBj402kttIhICnS3qeZcRERE5FySsTXnxpi/Ar4O7Aausda2jvdaa23AGPNdYDNwefg+Y10Td/b6cI36hvE+W0QkFaJrzgtVcy4iIiJy1svImnNjzF8D38SZp/yq8IjtyWoKL/NTVS4RkekSU3NepppzERERkbNdxoVzY8zfAV8FtuEE88YJ3urC8PLwqGeJiGQYG7Lqcy4iIiJyjpn2cG6M8RpjlhtjFsU59vc4A8BtxWnK3jzGvTYYY0a8BmPMNcDHwps/SUGxRUSmTW/XAKGgBSA7z4M3253mEomIiIjIVEtJn3NjzG3AbeHNmvDyImPMD8PrzdbaO8LrdcAe4BgwP+oe7wU+BwSBp4GPGGOGP+qotfaHUdtfAZYYY54DTob3rQWuDq//vbX2uQm+LBGRtFCtuYiIiMi5J1UDwq0H3jts38LwFzhB/A5GtyC8dAN/neCcJ4EfRm3/GHgjcD5wE+AFGoC7gP+w1j49ZslFRDKM+puLiIiInHtSEs6ttXfizC0+nnOPAiOqxJO5R9Q13wO+l8w1IiKZTjXnIiIiIueejBsQTkTkXBcbzlVzLiIiInIuUDgXEckw0c3aCxXORURERM4JCuciIhnE7wty+mBHZFvN2kVERETODQrnIiIZ5JWHjtHT7jRrzy30UrWgKM0lEhEREZHpoHAuIpIhOpv7ePXh45HtC29bhDdLc5yLiIiInAsUzkVEMsSzvz5IMBACoGpeISsumpXmEomIiIjIdFE4FxHJACf2tnL41abI9mVvW4pxjZh1UkRERETOUgrnIiJpFgqGeOauA5HtZZtrqFlYnMYSiYiIiMh0UzgXEUmzHU+corW+BwBPtpuL3rgozSUSERERkemmcC4ikkYdTb28cPehyPamm+aRX6K5zUVERETONQrnIiJpYkOWx/53LwG/MwhcWW0+66+Zm+ZSiYiIiEg6KJyLiKTJzqdOUX+gHQDjMlzz3hW4vfq1LCIiInIu0rtAEZE06Gzu47nfDjVnP+/6uVTNK0pjiUREREQknRTORUTS4JWHjxPwBQEonZXPBa9bkOYSiYiIiEg6KZyLiEyzwECQAy83RLYvf9sSNWcXEREROcfp3aCIyDQ7sr2Zgb4AAEWVudQtK01ziUREREQk3RTORUSm2Z7nT0fWV1xUgzEmjaURERERkUygcC4iMo26Wvs5safV2TCw7MJZ6S2QiIiIiGQEhXMRkWm074UzYJ312ctKKSzLSW+BRERERCQjKJyLiEwTay17o5q0L79IteYiIiIi4lA4FxGZJq31PXQ09QGQleNm4XmVaS6RiIiIiGQKhXMRkWnSeKwrsl63rBRvljuNpRERERGRTKJwLiIyTZqOD4XzyrmFaSyJiIiIiGQahXMRkWmicC4iIiIiiSici4hMg1DI0nxS4VxERERE4lM4FxGZBqcPtBMYCAGQX5JNfnF2mkskIiIiIplE4VxEZBoc2NIQWV+wriKNJRERERGRTKRwLiIyxY6+1szuZ+oj20s2VaWxNCIiIiKSiRTORUSm0JkjHTz0Pzux1tmuXlDErEUlaS2TiIiIiGSelIRzY8ztxphvGmOeNsZ0GmOsMeYnE7zXbGPM940x9cYYnzHmqDHma8aY0lGuWWmMucsY02iM6TfG7DPGfNYYkzvxVyUiMjntDb3c/63XCPidvuZFFTnc9ME1GJdJc8lEREREJNN4UnSfzwDrgG7gJLB8IjcxxiwCngOqgHuAvcAFwEeBG40xl1hrW4Zdsxl4DPACvwJOAFcD/wBcY4y5xlrrm0h5REQmqrdzgPu+uY3+bj8AOflebvnweg0EJyIiIiJxpapZ+8eApUAR8BeTuM9/4gTzj1hrb7PW/j9r7dXAV4FlwOejTzbGuIEfAHnA7dbad1hr/w7YDPwauCRcNhGRaRMKWe7/1nY6m/sB8HhdvO5DaympzktzyUREREQkU6UknFtrH7fWHrB2sFdl8sK15tcDR4FvDTv8j0AP8G5jTH7U/iuAFcBT1tp7o8oTAv42vPlBY4zakIrItDm5t5XGY86c5sbA9X+6ipqFxWkulYiIiIhkskwaEO6q8PLhcLiOsNZ2Ac/i1JBfGHXo6vDy98NvZq09DOwH5gELU13Y/m4/u5+t57XHT3JsZwuh0IQ/lxCRs0zzye7I+vKLZ7FgXWUaSyMiIiIiM0Gq+pynwrLwcn+C4wdwataXAo8mcc3S8Neh0R5ujNma4NCI/vPWWu7+6iu0nOqJ7Lvij5ay+orZoz1CRM4RrfVDvxsq5xSmsSQiIiIiMlNkUs35YJvPjgTHB/eXTPKaSfP1BmKCOcChV5tS+QgRmcGiw3nZrPxRzhQRERERcWRSzXlaWWs3xtsfrlHfEL0vMBAacV7T8S6stah7u8i5zYYsbaejwnmtwrmIiIiIjC2Tas4Ha7kTjZo0uL99ktdMWjAQHLHP1xuIjMwsIueuzpa+yLzmuYVecguz0lwiEREREZkJMimc7wsvlyY4viS8jO5fPpFrJm3wjfdwTce7UvkYEZmBYpq0q9ZcRERERMYpk8L54+Hl9caYmHIZYwpx5izvBV6IOvRYeHnj8JsZYxbihPZjwOFUFjSYMJx3pvIxIjIDtUY3aZ9VkMaSiIiIiMhMMu3h3BjjNcYsD89rHmGtPQQ8DMwHPjTsss8C+cCPrbXRI7E9CewBLjfG3Br1DBfwxfDmdyYz/3o8icL54LzGInLu6mwZ6t5SUp2XxpKIiIiIyEySkgHhjDG3AbeFN2vCy4uMMT8Mrzdba+8Ir9fhBOpjOEE82l8CzwHfMMZcEz5vM84c6PuBT0efbK0NGmPej1OD/itjzK+A48A1wCacudG/OukXOEwgMBTOC8qy6W71ARoUTkSgr3Mgsp5XpP7mIiIiIjI+qRqtfT3w3mH7Foa/wAnidzAGa+0hY8wm4HM4TdVvBk4DXwc+a61ti3PNi8aY83Fq168HCsPP+xzwBWutbyIvaDTRNedls/Lx9wfx9Qbw9QboaumnqCI31Y8UkRmir8sfWc8r8qaxJCIiIiIyk6QknFtr7wTuHOe5R4GEVcvW2hPA+5N8/m7gLclcMxnR4dzjdVMxp5BT+5zPDRqPdSmci5zD+rqHas5zClRzLiIiIiLjk0kDws0Y0aO1u70uquYWRrY1YvvM5h8IsvOpU+x44iShYPyxBURGE1NzrmnURERERGScUtWs/ZwSW3PuonJedDjXiO0zlQ1Z7vnqqzQcGfo3XHPl7DSWSGaazpY+BvoCALjchuw8/YoVERERkfFRzfkEDK85r4yqOW8MDwonM097Y29MMD/0amMaSyMz0cGtQz8zs5eXYlwaHFJERERExkfhfAKCw8J5cWUuWblODZmvxxkUTmae5pPdMdunD3Xg9wXTVBqZiQ5uGQrnizdWp7EkIiIiIjLTKJxPQDAwFNg8HhfGmNjac813PiM1n4j9dwsFLCf3thIKqSWEjK29sTcy5oTLY1i4viLNJRIRERGRmUThfAKGN2sHNCjcWaD5RPeIfQ98ewe/+NyLdLb0paFEMpNE15rPXVlOdp6mURMRERGR8VM4n4DhzdoBDQp3Fmg6OTKcA7Sd6eW+b2yPmSJLZLiDWxsi60vOr0pjSURERERkJlI4n4Dh85wDGhRuBrPWsuXBo/R1OuHbGMgrjp0Cq72hl/u/9Zr6oEtcrfU9tJzqAZwZHOavUZN2EREREUmOwvkEBIZNpQZoULgZbPujJ3jxnsOR7ZqFxbz1U+dz0wfXcNnblkJ4wO2GI5089D876e/268MXiXEgqtZ83poKsnI0hZqIiIiIJEfhfALi9Tl3BoUriOxXv/P0627zcXRHM8FAKOE5A/0BtjxwNLLtyXKx6XXzyS/OZuH6StZeNZvL3ro0cvzYzha+d8fTPPDtHQSDie8r5w4bsux/8Uxke8kmNWkXERERkeQpnE9AdNhze4a+hZVziyLrjQrnaRMKhnj+t4f48d8/x/3feo1HfrA74bk7njiJrzcAQE6Bl/d94RLmriyPOWftVbPZeNO8mH1HX2vmmbsOpL7wMuOc2t9GZ7PTUiY7z8O8NeVjXCEiIiIiMpLC+QQE4zRrB43Ynil2PV3PKw8dIxRwmp6f2t8W9zy/L8i2R05Eti9646KEI2xvvnUhKy+ZFbNv55On2PX0qRSVWmaq3c+ejqwvvaAmMg6FiIiIiEgy1DFyAuI1a4fYQeGajjmDwhljprVsAm0NvTHb/oH4zc93PnWK/m4/AIVlOSzbXJPwnsYYrnzXchZvrObJX+yjo9GZWu2pn++nqCKX/OJsOlv66Gzup69rgDkrSqldUpqiVySZqr/Hz+FXmyLbKy+dNcrZIiIiIiKJKZxPQLyp1GBoULiBvgD9PX66WvspKs9NRxHPaQN9gZhtGxw5eFtgIMirfzge2d5w47yYLgrxGGOYs7KMt336An7z5a00n+gmFLLc+/VtI8599Q/HedfnLqKgNHtiL0JmhP0vNUS6uVTOLaRiduEYV4iIiIiIxKdm7RMQ3ec8ulm7cQ0bFO6Ymranw/BwHgyEsCFLb+cAZw53sP+lMzz5s32RqdPyS7JZcdH4azy92W5u+uAacgvjN4EH5wOcxmOa7/5st/f5oSbtw7s9iIiIiIgkQzXnE5CoWTs4g8Kd2tcOOIPCLdqgkZun20B/YMS+//7rJwkkaN6+4Ya5I/4dx1JUnstNH1jDg/+1A19PgIKybIoqculp99F2xmlWn6rp9Ky12JAlFLKEgnHWg852wvXwMmY96j6lNXlUzi1UF4wkBQaCNJ1wPoAzBpacX53mEomIiIjITKZwPgFBfzCy7hkW6jQoXPoN9AVH7EsUzAvLc1h5Se2EnjNrcQnv/7dLsRZcLifYbv39UV6425kz/bXHT3B0R/OIQD2u8By1bkNTP6f6jR9YzaLz9EFSMtoaeiH8T1NUmZtwMEERERERkfFQOJ+AmJpzT+zIzBoULv2GN2sflJXjpqgyl6IK56u4MpcF6yrwZE18dG1jDNH/vIXlOZH1zub+yBRbme7YzhaF8yS1ne6JrJfNyk9jSURERETkbKBwPgGJplKD8KBwOW4G+oPjHhSuv9vP4e1NVM4pjAn3MjHRzdqv+5OVlFTlUVSRS3aeZ8o/KJm7ojwyKGAqGZfB5TIYt7NMuO42kXNd4X0mej3qmt7OAU4f6gDA1xsg4A/S3eaju7Wf7jYfoaBl3ppy8os1qF08rVHhvFThXEREREQmSeF8AhKN1g6Dg8IVcmp/O+A0bU8Uzv0DQV577ASv/P4YA/1BPF4X79QI35PmiwrGC9dVTqpmPFk5BV7e/c8X0XCkE2OIDdBxwvOI9XiB2mWm5EOFE3tbufdr2wA4sq2J//rwkyPOqVlYzJv/dmPKn302aDs9NGWfas5FREREZLIUzpNkrSUQiG7WPjI0xYTzY10jmguHgiH2vnCGl+47Qk+7L7I/4A9xbGczqy6rm5rCnwP8A0FCAacjsMtjkh7oLRVy8r3MW10+7c9NVk5UH2mboFv7mcMd+Hr96k8dR6uatYuIiIhICimcJykUtJFBoJwaz5Hhr3Je/EHhrLUc3dHC8789FNNfNdqpfW0K55PQ1zUQWc8tyFJ//1GU1eVTUp1He4NTA2xchvySLArLcmit78HX67RA+PlnX6SsNp/L376Mkuq8dBY5YwT9IToawzXnBkpq9H0RERERkclROE/SaE3aB1XNLYqsNx53BoVrONLJc785yOmDHTHn5hVlsezCGl59+DgAJ/e3axC5Sejv9kfWR5uHXMDtdvHWT51Pe0MvuYVe8oqzI6POP/Dt1ziyvRmAno4BejoG2PrgUa5538p0FjljtDf2RlobFJXn4J3GrhMiIiIicnZSOE9S9Ejtnqz44TxmULhuP7/7j+0c39Uac443x82G6+ey7pq5eLwudj9Tj683QF/nAG2neymrVTPZieiLCuc5+QrnY/Fmu+MOQlhWmx8J54MG5/ROxFpLMBAiMBAi6A8R8AcJDIQI+EMEo9Yj+wdClM7KY/bSUoxrZn0YdWLP0P9nDQYnIiIiIqmgcJ6kQNQc525P/HA+fFC46GDuchtWXV7H+TfPJ7cwK7K/bmkph7c1AXBqf5vC+QTF1JwXKJxP1OrLZ3PmcCdBf5AzhzsBaD3dy2///ZW4YTs4EHLGYpjAlOyLNlRy7ftWTuvAfZNxeFsTz/3mUGS7ZkFxGksjIiIiImcLhfMkjadZO8QOCjdoyaYqNr9hIcWVI/un1i0riYTzk/vaWHPl7NQU+BwT3ec8J+rDD0lOQWk2t33sPAB+9Mln6W7zYUOW+gPtKX/WoVea6Gp9lUvfsoSaBUUZXYt+Ym8rD313JzbkfApRPruAtVfp/6qIiIiITJ7CeZKCgcRznEdbvLGabY+eAAt1y0q5+E2LqJpXlPD8umWlkfVT+9uwIZvRISVTqeY89ZacXx0ZE2EsLo/B43Xj8brwZLnwZDnrbu/Qusfrwp3lxtfjjzSdbzzayW++tBUMvPufL0o4/eB0CgVDHHmtmaZjXbQ39tHR1EtrfY8zKCRQXJXLrR9ZT1aufo2KiIiIyOTpXWWSovucJ2rWDlC9oIh33nkhAX+I8rr8MQd4K5uVT26hl74uP76eAC313VTMHtkXWEbX16NwnmoX3baIhesr6e/xDwXsLBcerzscuofWXUl+oLTjiZM8/cv9Q1O5Wbjr8y9z+99twpvjJjvPg8ebnubuWx44ysv3H417rKA0m1s/up68IrXOEBEREZHUSFk4N8bMBj4H3AiUA6eBu4HPWmvbxnH9lcDj43jUXGvtiajrRuvl+qK19sJx3HPcxtusHUhq2iljDHVLSzm4tRGAk3vbFM4noL8rakC4AgWnVDAuQ83CqelXvebK2RRV5vK7b26P7PP1BvjpP74AQEFZNm/46HnTPoWbtZY9z5+Oe6xiTgHX/8mqjKjdFxEREZGzR0rCuTFmEfAcUAXcA+wFLgA+CtxojLnEWtsyxm2OAp9NcGwN8CZgZ3Qwj3IM+GGc/SfHLHySosP5aM3aJ6Ju2VA4P7W/nfXXzk3p/c8Ffd1Rfc5Vcz4jzFtVzrv/+SKe+sV+ju2M/TXR3erjvm9u43UfWkd/j59ZC4unpbtHy6luult9AGTluLns7UsprsyjpCqXnAKvpjoUERERkZRLVc35f+IE849Ya785uNMY8xXgY8DngQ+OdgNr7VHgznjHjDE/D6/+T4LLj1pr416bajHN2lPc3HZ2VL/z+v1thIIhXO7UfgBwtlOf85mpqCKX1//VOuoPtnP/f2xnoH9oVoTO5n5+/tkXAZi7qpzXfWht0s3nk3X0taFp5OauLmf5hbOm9HkiIiIiIpNOfuFa8+txar6/NezwPwI9wLuNMROaG8wYUwG8EegD/nfiJU2Nqaw5L67KJb/YaYo90B+k6UR3Su9/LoiZ51zhfMapXVzCWz55PptvXcCGG+YxvIL6+K4W7v36Np77zUHazvRMSRkG+gLsfnaoSfv8NRVT8hwRERERkWipSJdXhZcPW2tD0QestV3As0AeMNG+3+8FsoH/s9a2JzinxBjzx8aYTxljPmSMSWk/82iBJPqcJ8sYQ93yqFHb943ZVV+ihEKW/h6F85mupDqPTTcv4KI3LuLyP1o24vipfW28+vBx7vvGdgL+YJw7TFx/j597vvYqXS39gDPo4/w15Sl9hoiIiIhIPKlo1j747nl/guMHcGrWlwKPTuD+fxZe/tco56wDvhe9wxizHXi3tXbHBJ6ZUPRUaqkO5wB1S0vZ/2ID4ISQDTfMS3huV2s/z/zfAU4fbOeiNy5mxcXndtNbX68fwsMDZud5cKtLwIy3+vI6KmYX0NPuY8uDR2mOak3S1drPc786SFltPt3tPnrafXS3hZftPnILvNz0wTXjHlixr2uAe76+jZaTQ8+49C2Lyc7ThzwiIiIiMvVSEc4Hh3HuSHB8cH9Jsjc2xlyBE/53WmufS3DaV4Bf43w40A8sB/4OuB14zBiz3lp7ahzP2prg0PLojZhm7aNMpTZRMf3OD3UQDIZGhExrLXuePc2zvzoQ6Zv7/G8PsvyimnN6oKro/uY5+QpUZ4vBkeIr5hRw79e30dncHzm248nE/7X9/UGe/Nl+3vSJDZH/F6FgCF9vAF9vgP4ef8xy51OnaDs91FT+incsY/XldVP0qkREREREYmX6POd/Hl7+d6ITrLUfH7ZrC/AWY8yvgDcDd+AMSpcS0c1op6LmvKgil8LyHLpa+gn4gjQe7WLWoqFprDpb+njiJ3s5sSe2yXtfl5+Opj5KqqZ3yqlM0hc1jVpuocL52aa4Mo+3/8Nmgv4Qv/rCFjqa+sa85szhDn75zy8x0BfE1+uPGWguEWPgqnevOOdbooiIiIjI9EpFOB+sGU80EfLg/vZkbmqMKcMJ133AjydQru+Er798PCdbazcmKMdWYMPgdjLznE9U3bJS9j7nDEh1al8rsxYVY61l19P1PPfrg/h98QNGw+GOczqcN53oiqznFWWnsSQyVbxZbrxZbm78wGqe/+1hsJb80mzyS7IpKAkvS3PY/tiJyP+hllPjHzjOuAzXvX8lS86vnqqXICIiIiISVyrC+b7wcmmC40vCy0R90hMZHAjuR6MMBDeapvByQqPEJxLd5zzVo7UPmr20JBIsTu5rZ+kFfTz2470xA8QZA+uunYvLZXjloWMAnDnSybIZMuWTr9ePcRmyclLXeOPAyw2R9Tkry1J2X8k8FbMLueXD6xIev+D1Czi6vTlmgEAAjDMeQXael5w8D9n5Uct8L4s2VFExu2CKSy8iIiIiMlIqktHj4eX1xhhX9IjtxphC4BKgF3ghyfsODgSXsEn7GAZHbD88wevjCsRMpZbaec4H1UX1Oz99qJ2f/9NLBKJqy0tr8rj6PSuoWVjMid2tQ+H8cKJu/5nl9KEO7v36q7g9Lt7wsfOonDO+AbtG09ncR8ORTgBcLsPiDVWTvqfMXIVlOfzRP26mtb6brFwnjGfnecjO9WCmeI50EREREZGJmHTVr7X2EPAwMB/40LDDn8Wpuf6xtTbSttQYs9wYs5wEjDGXASsYfSA4jDFrjTEjOhcbY9YCnw9v/mScL2VcpnIqtUEFpTkUV+UCEArYSDA3BjbcMI+3fvr8yCBZ1QuKIJw1Wk71JGzynkkObGkgMOAMzHXX518mFAyNfdE47jlozsoyTaMm5BVlMXt5GVXziiiuzCUn36tgLiIiIiIZK1Vtiv8SeA74hjHmGmAPsBlnDvT9wKeHnb8nvEz0TnnMgeDC/ga4xRjzNHAC8OGMrn4j4Ab+B/j5+F/G2GL6nE/BaO2D6paV0tE4NOBVWW0+V79nBdXzi2LOy8r1UDYrn9b6HmzI0ni0M6bmPRM1R/UNB3jt8ZOsv3bupO4Z3aRd/YVFRERERGSmSUm6DNeebwJ+iBPKPw4sAr4OXGitbRnvvYwxpTjToI1nILi7gSeB1Th91D8CbAQeBN5grf1za61N5rWMJWYqtSmqOQdYfVkdbo8L4zJsvGkeb/3k+SOC+aCaBUP7dz1TT0+7b8rKlQquYVPDvXjfEbpa+0ecZ0OWxmOddLeNPBatpb47MuiX2+tiwbqK1BVWRERERERkGqRsNC5r7Qng/eM8N2HbUmttG5A7zvvcjRPQp810NGsHqJxbyPu+eAnGQHbe6E20qxcWs/tZZwC5Ay83cOS1Zt7+mQsorhzXt3FahUJ2RM15wBfkqV/s5+a/WIMxhmAwxMGXG9j6+2O0nenFk+3mnXdupqA0J+49o2vN56+pSOkgcyIiIiIiItNBKSZJ0aO1T2U4B8jJH1+/6cH+54MCviCP/2QPt31sQ4Ir0qfxaCe+3sCI/Udfa+bAlgYGegO88vBxulqGassDviCnD3WwZNPIcG6tjQnnS9WkXUREREREZiCF8yTFNGufwj7nySitziM7zxMTek/ta09fgUZxfNdQD4flF8/C7TbseroegD98b3fC6xL1Tmg82kVnsxPks3LczF2tKdRERERERGTmUThP0nQ1a0+GcRmqFxRxfFdrzP7+bn/GjVp+LKqMc1eWMWdFGYe3N9PXORBzXk6BF2+We6gvelQ2DwZCnD7YztEdLRx+tSmyf+F5lVM2vZ2IiIiIiMhUUjhPUtA/NFWZJyszwjk4TduHh/MTe1ozauTyvu4BGo85c5EbA3NWlJGT7+Xyty3loe/uBAv5Jdmcd91cVl5ay+M/2RsJ531dfva+cJqjr7VwYncLA/0jp4xben7NtL4eERERERGRVFE4T1JgmqZSS1b1gpEjuR/f1TKucB4MhDiyvZnAQJBlm2umbC7oE3taIzXg1QuKI33qF2+soqB0I/09fuasKIt8X01UMZ75vwMJ7+vJdrPyklnMXpHZU8iJiIiIiIgkonCepGAGNmsHJ+wOd2x3KzZkE4btgf4Au5+pZ9sjJyLTr7XW93DxmxdPSRmja/bnrortGz58UDsAYxJ/SFBYlsP8tRXMX1NO7dISNWcXEREREZEZTeE8SdGjtWdSIMzO9TBnZRkndg8F4L7OAZpPdlM5tzDm3P5uP689foLXnjiJryd25PTXnjjJumvnkF+cndLy2ZCNGQxu7qryMa8pryuIrBsDNYuKmb+mgnlryimblT9qeBcRkcwWDFm2n2xnSVUBhTmZNT6KiIhIOiicJykTB4QbdN0fr+TI9mb2Pnea04c6ADi+uyUSzrvb+tn2yAl2PVNPwDeyzzY4LQO2P3Ii5bXnzSe76evyA85gb1XDPjCIZ921c8gvzcJgnP7pGTa4nYiITNzf3LWNe7bVs7S6gHv/6lJyMugDbxERkXRQOE9SJk6lNii3IIuVl9TidpuhcL6rlYXrK3n14ePse/EMoWDslGRFFTmcd91csvO8PPy9XQDseOoUG26YN+Ew3NXaT+OxTmoWFkdq4I9F15qvLBtXv3aXy2iQNxGRs5AvEOSebc40mvsbuvneM0f40FWp+VC4xxfgTGc/DR39NHX7WFZTyPKakeOyiIiIZBqF8ySEQjYm3Lo8mdmses7KoSbj9Qfb+dlnX4yZigygvC6fDTfMY/HGKlxuFzZk2fr7o7Sc6iHgC7L9sRNsvnXhuJ5nraXtdC+HtzVxZHsTjce6AGfk9Xf/00W4va6km7SLiMjZa9+Zrpjt7zxxiD+6YC5l+VkJrwkEQzR3D3Cms58zHf00djnLM539NIT3NXT66PbFdtfyug0PfvRyFlcVJLiziIhIZlA4T0J0f3O315WxfZ7zirKonFtI0/GuEaF81qJiNtw4j3mry2PKb1yGjTfN5+HvOrXnrz1+kvXXzSU7N/6PiA1ZGo52cnhbE4e3NdHR2DfinJ52H80nuympzuXM4c7wg5yacxEROXftru+M2e7yBfjig3u5ZV1tTNg+09lPY6ezbOryEbIJbjgKf9Cyq75j3OHcWktnf4AzHf2c7ujjdEe/89XeR1d/gNevm8Xr19YmXxAREZExKJwnITgQPRhcZjVpH27+2gonnIfNW1POhhvmUbu4JOE1izZUUVJ9hPaGXgb6Aux44iSbbpofOR4MhDi1ry1cQ95Mb+fAmOVoPd1Nd1s/NvyOqmpuIbmFiWtGRETk7HeirXfEvl9uOcEvt5yY9L2z3C6qi7Pp6g/Q3uuMdRIM/w0aLXif6eynvr2PMx399AzEH5cF4LG9jWxeUE5lYWoHTpVzh7WWQMgSDFlCNrwMQSAUImiddWc58rzIV/j44Prg/uqiHJbXFGZsBZKIjE7hPAmZPBjccOuvnRMJz6svr6Ni9tg1Bi6XYeNN83j0h3sA2P7ICVZcPIv6A+0c2d7MsR3NDPTHf8PiyXYzb1UZC9dX0nS8i22POG+wWup76IsK8WrSLiIip9pGtrYaj/L8LKqLcqguyqamOIfqohxqinKoLs6hujCHmuIcSvO8GGO44/+286utJwH4j8cP8q3HD44ZvMdjIBhi75lOKgsrJ3WfmczakaFwMFDGC4+BYeEyFA6noZhznXDqnMco5411P8Z5XqL7Me7nxrzOqNcweI9gKCpgR51nJ9ACJBmff+Nq3rl53tQ+RESmhMJ5EoKBoT/omV5znpXj4cp3LEv6uiXnV/Py747Q2dxPf4+fH/6/Z0c0jR+UW+hl/toKFq6rZPaK0sjUcm6PC3DC+aFXGulu9UWumbda4VxE5Fx3qn0onP/zbav59SsnaesZCAfvnNjgXZRNdVEOVUXZZHvGP6K7J2rg0cNNPUmVL8frorY4l5riHGYV5zKrOIcXDrew5VgbAM8daqEg2+OEuKAds7Yz9jyb4DzinhcdBBMHQwiGQjHhMlGATHi/wdcwInTbEaF7qsOlTM63nzjEH50/F1f4/0B77wAvHWnlhcOtvHC4hWMtPfzpZQv52HVL01xSERlO4TwJMTXnGTZSe6q43S423DCPJ366z9kx7A9wYXkOC9dXsnB9JTWLiiO/+KOV1eZH1qOD+fw15VQv0Ii5IiLnuuia80sWV/CuC1Nfy7e8Jv6UnfGC96ySHGcZ3i7O9Y5oFvyfTxyMhPNvP3GIbz9xKOVllnOH22VwG4PLBR6XC5cJ73MZXMbgcRlc4W3nvPA+Ez7HZXCb8LUu59ptx9vpGQhysq2P/3ziIK09fl443MKeM50jPlD59hOH+Mg1S3CPY/acmcxaS8iCPxhyPgwLWvzhD7L8wcGlJRAKEQgOfmAWwh+0kXMG9wdCQ+ePOCdkR9xz8JzY60Y+d+R1Q9uDrTWuXFrJnbeuUneFc4DCeRKCM6hZ+2Qsv3AW2x87Sdtpp6ahfHZBOJBXUF5XMOYvhuLKXNweV8wAelm5Hq54x3L9UhEROcf5gyHOdPZHtmtLcqbkOe+5aD4Vhdm09/qpLcmhpiiX2pL4wXs8VtUWT0EpZ67ocBkdHt3RAdIYPO6hcBkTMsPhMvq8wevcg0vX0HXuYUHVHX6u2+XC7WKU8xLdj6Frx/NcV/zyDV4fHZJHvs6RoXsq3HnvLn743FEAvvzw/lHPHQiG6BkIUJjtiYTA6PAaGBZYY9bDYXR854Qi9469LvpYVFgdfk5UeI33nLgBOiaAnx3NPH70/DGuWFbJ1curU3I/ay2+QIhuX4AeX4AeX5Cegah1X2Boe8DZ7vYF6B12XkGOh79//UrWzylJSblE4TwpMXOcn8Xh3O118aaPb+DMkQ5Ka/IprsxN6nqX20VJTR4tJ7sj+y65fTEFpRo8R0TkXHemoz8y6npVYXJN1ZPhcpmUjqp++ZIKPnD5Qp4+0BwOYa6YcBkd4qLDqNsdG86iQ+Ho58W7n9PCbTBcJvPc4eF3sMY2+j6jhenY0I0+bM9Ab900JxLOo7ldhtV1xVy4sIxfvHSCjj5noMQNn/sDgdDZEV7PBX/Y3cCq2uJIMO72BegdCIfm6AA9ED7mC9AdDtqD5w2G8N6BYGSgzMn6zN07+N2HL0vJvUThPCmBwLlRcw6QU+Bl/pqKCV9fXpcfCedzVpax4uJZqSqaiIhMUn17Hw2d/ayfUzLtISu6v3ldaXIf/qaTMYZP3ryCT6a7ICIJrKwt4gOXL+SuLSeYV57PhQvL2bywjE3zSinM8QLw9P7mSDg/V4K5K9z83+N2Plzyul14wh86eQbX3U4rDK87vH/Y+c4yvH/Y+fHuOXj+0D2jr0t0z+jrnHN213fy17/cBsDPXzrBz1+a/IwWqbbzVCdP7W+iLD8r7kwCiQZ7HD7uxdDx8PgZlpgxL6LH6wgOGwQycp8Rz048JsfwZx9u6h77xU4DhfMkxDRrn6JP+s8Wa66czfGdreQWernqXWrOLiKSKU539HHFlx7HH7R88c1reNv5c6f1+dH9zetKZk44F5kJPnnzCj5584qEx//88oV85u6ddPsCkX3xwqvbZfAmCK/Osfjh1e1yha8bGV6j7zk8vI52z9HCa3SQHn7O4HVT1Y1gOswrz+NTv3XTO8lZJuLJ8rjIz3KTn+0hP8tDfnb0evR2eDnsvK8/coBnDjYD8J7vv5Ty8k23qfgeT4TCeRIC0fOcZ53dNeeTVbOgmD/+0qWYGfwLUUTkbPT5+/dE+mH+3a93pDSc+wJBGjt9NHb5aOzsd5Zd/TRE7YsJ5zOo5lzkbHDbeXXcvGYWgVAoEohncng922V73Hzq5hV86aF9+IMh8rI8FGTHBuq8bA8FCQK1c37U/vCxvCwPWZMc3Pr2jbMj4VxSR+E8CdEDnJ2to7WnkoK5iEjmae0ZSPqafv9g6B4M2k7wbujspym8bOzy0d7rT+q+C8rzxz5JRFIqy+MiC72PnSnedeG8KZnRYrJuWVfL1mNtvHC4BdeIgRpHjp/hGjb2hif8wZDbxA7omHgwRkaMh+EeHHhxxLVjjMnhir6Pc9/33V/A3oZ0f1cVzpNyrgwIJyIiZy9/MBSzfbS5Z1gNd39sEO/sp7M/kOBuE+MycOHCcm5Zl7oB20REZPq4XYZ/um11uouRMnlZmdFlWeE8CYFzZCo1ERE5e/X4YvvVXfnlJ1J2b7fLUFGQRXVRDlWF2VQNLgtzqC4aWpblZ+Fx6++oiIhINIXzJJwr85yLiMjZ63RH39gnDeNxGSpjwnZ2JIBXF+WEj2VTnp+NW12aREREJkThPAnBwFBtg0d9zkVEZAYqzc+iLapveF1JLpWF2TE121WFOVRFLcvysjRolIiIyBRTOE+CmrWLiMhMZq2lqcsX2X7xU9dQXZSTxhKJiIjIICXMJKhZu4iIzGQtPQN0hQd3y89yU1WYneYSiYiIyCAlzCQEYkZrz4wR/URERMbrcFNPZH1hZQHGqKm6iIhIplA4T4KmUhMRkZnscFN3ZH1BheYYFxERySQpS5jGmNnGmO8bY+qNMT5jzFFjzNeMMaVJ3OMJY4wd5StuxzhjzEpjzF3GmEZjTL8xZp8x5rPGmNxUvT5Qn3MREZnZjjRH15wrnIuIiGSSlAwIZ4xZBDwHVAH3AHuBC4CPAjcaYy6x1rYkccvPJtgfiPPszcBjgBf4FXACuBr4B+AaY8w11lrf8OsmIhiICucarV1ERGaYQ8OatYuIiEjmSNVo7f+JE8w/Yq395uBOY8xXgI8Bnwc+ON6bWWvvHM95xhg38AMgD3iDtfbe8H4XcBfw5vDzvzDeZ49GzdpFRGQmO9I81Kx9oZq1i4iIZJRJJ8xwrfn1wFHgW8MO/yPQA7zbGDMV7wKuAFYATw0GcwBrbQj42/DmB02KRrxRs3YREZmpAsEQx1t7I9vqcy4iIpJZUlFzflV4+XA4FEdYa7uMMc/ihPcLgUfHc0NjzNuABcAAsAd4LEHT9KvDy98PP2CtPWyM2Q8sBRYCh8bz7NGkYiq1l4+28vLRVt66aQ4VBZrCZqKstWw/2cEzB5pYVFlAa+8AOR43b9pQN2L04VDI8ouXT2AMvHXTHNyuaRyduKcFXvslFNbAqjfCBD4nCoYsh5u62VnfwaHGHjbMK+Hq5dXxTw4FYedvINAHNWvh4B9g9ZuhbOEkX8gkdTfBnntgoAc2/Qlkp7k5bcAHJ16E4y9CyRxY+7ahf5vd90B3I6y4Bbb/AmZvgvmXjn6/YMB5fa1HsBvfR4+nhPbeAdp7/XT0+Wnv9dPeN7Q9vzyft58/B9dU/SxaC31t0HYEWo84S+OG894NBZXOOW3HYNvPYOn1ULdx1NuFQpaGrn6ONvdyrKWHk219tPT4WFRZwFvPn0NRjjc15Q6FoK8Vus44X93hpa8LVtwKs0cvZ0TABydecv6Nyxc5//dGYy007IJDjzn/V9e+NaliW2vp8wcj/9YdfeGvwX//vgE8Lhe3b5zNnLK8pO49WdZamrp9HG/pZcepDvxBC0B1UTb52aO8BQgGwN8D/j7w98JAb3g9vG9g8NiwfQVVsOE9kDvu4WYyWzAAA93OaxvoGWU9vA2w/h1QuSy95U5WKDj0enzdUa9tcF9X1HY3FFTDxvdBdmG6Sz66UMj5+fQNvp6uYa+xO/ZYXrnzNyqnyLm+t9X5G56VD+vfCa4pmqknFAJfh/N7u7fNWfa1hrdbIdAPVSuc3+cr3wDVK6emHGOx1ilLvJ+JgTjf56Aflr8e5m4e/zNCQehugI5T0HnSWfY0wfzLYMm1U/fapoO1zvck6IPAQHjpg+CAswz4Ru6LLKOvibrW7YX174KKxdP/ekLB8N+C3lH+TvQO+5vRC4Wz4II/B0/W9JcZhn6OI3/D+pz3zQM9Y187DVIRzgf/Au1PcPwATjhfyjjDOfCLYduNxpgPWWt/NYFnLw1/jRrOjTFbExxaPrgS8AcjOyfSrL2xs5/3fO8l+vxBdtd38h/v2JD0Pc51+xu6uHdbPfdur4+pARpUlOvlupWxwfU7Tx3i336/D4C8LDdvWF839QUNBeGVH8Gjn3P+uAIUz4E55496mT8Y4kCDE8R3nepgZ30nu+s76Yv62TMGnrzjKuaWD3uTHwrBPR+C7T+P3b/3fvjzJ1LwopI00AN7H3De2Bx6DGz4NfS2wHWfm96yhELQuAsOPQ6Hn4Bjzzm/iAflV8Lia2Drj+C+jzj7HrgDAOvOZs/bnqWZEtr7/HSEQ3d7n5+OHh+LWh7llpYfMjt4AoB7//AYH/V/aMwiuQy8/YK5k3hNQeg4CW1HY0N421FoPeq80Rvu1FZ4+0+dc757HfQ0wgvfhk8cJOjycrqjj2MtvRxp7uFYSw9HW5wwfqylF18gNPJ+QGOXj0/dvGLssvY0Q9dp501X15nw8jR0NYRDeHgZGjG0iGPL9+GOA+CNMy6otdC42/m3PfQ4HHvWeQMwyOWFFa8feU39q7DnXucDmdbDkUMN7T2cnPeGEWG7vddPZ1/4337YvoFg/O9PtCf3N3H3hy4Z87wxhULhNxbOG6KB/h4aW1ppam2jpa2dto4OOjs66Onuore3C2+wj1wzQC4+vuDxkWsGqHOF4H+/OfLN1OAbrJB/4uVrPwGv+/LkX2cyrHXeqI4aoMcI1vG2gxMYsmbPffCRV1L/GgdZO/Rmd0Qwit7uGvZ6ooPosOuifx+OV9cZuOHzqX1tQX9UORN8MJDo2IjX3+38XCer7Shc84/w/H/Ai/819KFLdhGsum30a611nt3X6oTqmJAdFbqHH+trAzv27xAAXv0x/PWO8X1QEPP9HPxZiPq5iPne9oz+MzK4zwbHfm60Ld93yptX5nx/epqHQnfnKefvWOepoe2u0/H/Djz7dfjjh5IL+taOHXID/YmD74hrw+cnPDb8/sPvk5IhsEba/zD85XMj9wf9saE4EqAHw3Nv1P54542xHhyYeJl7m+HaO0eWNxKYe6P+zvWBvz/OvuHnxtuX4Pp4Wrrj759mqQjnxeFlnHeCMftLxnGve4AvA68CLcA84L3Ax4FfGmNeZ62NriVP5bPHFJzkPOfPHGyOhKwDDZnxAzATnGjt5d7t9dy3vZ69Z7pGPffTv90RE87begb49uNDn8vsG+P6lDi1Fe7/uPPGP1rz/phw3u8Psr+hi52nOiNhfM+ZLgYShKBB1sIrx9tiw3koBL/765HBHJxyBP3Op6tTLRiAI0/Ca3c5b1DjvTFq2D315QAnIBx+gtDhJ+DwE7h6mxOe+qs/PMHTjw/wL/WfZHhDXxP08ZMffZufBa+J2mu50rWdOzx3sdp1NOb8q12v4CFAYIxfr4/saRg7nA/0hMP2kWEh/Ci0H086QNn9D1F/dD+lv34reT2Nzk5fB2/76r282p4/roAZzUOAe596mU+t640K2WdGhu+exvG/8UzE1+m8cStf5Gx3nQl/2BL+wKW7IeGlzY9+nQc71tDZ66Og6VUWND7Cyo4nqQjEv6bxka/x5oGqCRfVS4BcfM6X8ZGLE4xzT/no2tZMods/8k3O8JqFYftCAz2EwkHaE4wNUlnA7PDXCC7id2DrBw7H2Z8KJ14Y/XgoNPRmcNSQnGSYTjY0TJX2Y7HbgwEpXs3imLXUCQLTZP8/pcLBR+Hqz8QPxWPVUA//XgyuT1V4Scb2X8KOXzvlivbaXdDfPixYD25HhezJBJbx6DzlvMdwuRP8/ETty4Tv50A3/NtCKJ0HnfWT+P5Y+O2fQ+WKMUJ0/9Cxqf63yBSNu+Dbl44M3ZP5kHWqPf+fTktPf99QYE704fw5JlUDwqWEtfarw3btAz5ljKkHvgn8K3GasKfo2XHbS4Zr1DcA+Aeias6zkq8533KsLbIetDbp688lTV0+7n+tnnu21/Pq8fZxX9c7EPvm7NtPHqLLN/Sfvds3hf/xe1vh0c86ta+M/Pc92tLNU88fZeepDnae6mR/QxeB0Ph+DqqLssn2uCOtBfY3RL1psBZ+/3dOTX0iPc1QNCuZVzN+1sLp7c4bl52/GjUkAc6bmwnwB0NRNZkDtPU4NZjtvQN09Pnp72ylqvVlFnS+xPK+V5gdPAUkHljDZ71kG+cP156TLVzn+ir57vi1LIGou1xg9vAJ7y853xW/wU6h6WOz9wiH89ZQnOulJM9LSW4WJXlePG7DT144DsDWY23YUAjT2zys1vvIUAgfDNATEHTn0pE7mwb3LGq6d1IabMWE/Hh+cB15pj3m3PrWTgbs0MyTWfippJ0qM/jVxlxvJwtyuikPtZLd30SlaaOcLlzGwv9MuJgjZRdjC2sI5Vfhy60i69hTePqaANj+hx9juhuY1fIClX2jJ8ujoWpmmyY8JkRF80t4f/cR3uzeTo1pi3t+t80hCz9ZJsga11H+yv1bfHjJZYA84yMHH3nhsJ3DQGTdCeED5JoB8sPneRglJN49sW9Loow9ZYwLvPngzXW+sgbX85yvrPBycB/Ac99wls0H4ZfvThymJ1KbmS7GBVkFzuuPfMXZ9uTAs19zrgkF4GtrMitwjskMva7sgqjXGb2vwPm3fvrfAQtNe+DzNeku+Ni8+bGvIasg9jVmFzrr237mBN9ErQj23e98TZWsQqc7SF6ps8wtc2qbmw84H3pH2/qDqSvHWNzZw76fUf8nBr+XWflOTXeEdf6+jVdeORTVQfFspwn0K//rBM22o8ndJxO5PM730JPl/N5wZ4Ene2hf3GX2yHNsCJ6OaqHUsCMNL8aE/zbkjfw7EVkPL7PynPVX/tdpORH0jfwgczq5s6P+puWElzuAaajEG0Mqwvlg7XRxguOD+9sn8YzvAl8F1htjCq21g9+56Xh2RGAgquY8K/ma861Hh94UhsYZys4lHX1+Htp5hnu31/PcoWbifYuyPS6uXVHNLetq+dXWkzyyJzYIhqI+9Djd0ccPnzsac7y7fwrCeSjo/LJ59LNDTdiBgCuLLlcJpQEnYH3r8YP8XzBu3VaM2aW5rK4tZnVdEavqillVW0RVYQ53v3qKv/7lNgAONIZbXlgLD38GXvrv0W/a3ZD6cN52DHb8nxPKm/fFP6diqdOfu2Yt/OwtAIT62mnq7HeahvcOhJuKD/XJHrEdblY8/IMVLwE2mANc4t7BVa6drDOHcJvE/69abCHPhVbxTGgNz4ZW8073I/yF5z4AbnBv4QJXgtcAzC/28K6CFt7R/SNW9m6JORZ059Cw4r0U9p2i8NDvAPjp1b1wVbimPTAAHSeg7Qi29QjLcp6gKniGuYEG7L+0YAIJmleNgy+ngvbsOk67ZnE4WMHu/nK295RxJFhFM0XQ4/Rp/4znx/yp50EAqocFc4B/8PyEbAaodXdQZdopsp3xH9gfXk4gJfqzS/HlVNLjraDTW0abq5wWU8qZUAn1wWJOBIo45iukqd9Fe70/8sHVD70HudLthPN1e4d/fjuk3ebzbPjf9+nQGk7aKv7b++9c73Z6LL3d88SIazptHn8IbeTB4AU8HVrDv3q/y5vczwBwh/f/kn+R06jfeuklmz6y6bPZBNw5WE8urux8PDn5ZOUWkJdXSH5BIdl5hZiYN07xQvewfe6s5MbICAXh+W85tdeBPqe7wHRzZyUOz6MF69HWPTnj+z6EgkPhHJyWLVPJk5MgQOc7IS9hyC4c9lrDQdWTC65x/sfefQ+0HJia12Vcw8ofp9zRITtybNiHCIPnefPG3088FIBnon7HVCyDlbfCU19K7jV4cp1QnVs69BXZLovajlrPKUnc//bMDvivyyfWWmLE9zPBhy6JAna8a8fbCq+gGh761Mj9OcVQNBuK68IBvC52u6jW+T0ULbtgWNhPgssbDrZZsctI2I1zbHhAHjNEJ3Hf8f4/G4+jz4zeUsm4EwTm4R+yjrI+2jFPdvJjKZUthN/8aYLyuoaCvid36G9S5CvP+bcYEarHOj8vdr8nJ/7vhe9uhONT2CVpnFIRzgff0S5NcHxJeJmoX/iYrLX9xpguoBTIZ+hjjSl/drTAJGrOO/r87G8c+jRGNeeOvoEgj+xp4N7t9Ty5rylus1qPy3DZkgpuXV/LdStrKAgPYvTgztMjzo0O519/5MCIJuKdKQ7nXYdehAfuoLDltZj9jwbP47O+9/Bh9295iydx7ef88jxW1xU7X7VOEC/Nj/8Hekn10CBqBwfD+WP/7PSLG5RX4fTjGa574jWwMXpbYffd2Nfuwhx/Pv4p3nJ2ll/HCwXXsju0gPa9flxbzvCz8PGW5kY2/8t4h5+IZllmTnCpayeXunaw2bWXPJO4RqrfenkptJxnQqvZ5l1PQ94SivOzKc71cl5eFsvbt0H4s53oYB7MLsHta4+511+674bGb8c+wOWFTe/HfdnHqS2sgZ2/hnA455Ufw/EXnBrwjpORN1UGeDfA4N+EMX4crctDb14drVm1nDI1HApUsKO3nG09JRwLVdHXH6f/dRzPhNbwpzwYsy9gPHisU4Dr3FFDbiTxqylkDS0U4s+tosWU0UQJZ0IlnAoUc3ygiJOBIhptCU2UMNDvTdwBaahUI/a0EH/AqQHrZmtoGU+HVvNMaA077QJC4U8NCrM9zM7z8oz7Fq7vjh1OpM9TwqlZ19A690YCcy9lWUE+F4RbOBQ01sL3rx//NyCRyBsi5w1BRzCLQ+1B+mw2vWTTTxa9Noc+siLhOnrdCd1Z9JNNr3UCeNCdQ3lJCVXlpVSVlzKvvIB55fnMKctjdmkuORPoapVSLjcsutoZhHI8Bt8oTiQwx9v25qdvcCFwXv/SG2F/nMZ9owWkUQPTKAFqOropJXLF3zndqAa6wx+IRL+WBCF5RNAb/v0oDH9IMM4PQ6bCxR+Bk1ucptAX/LkzkKTL7dTi7nvQeS3Da7VHBO7SkcFysmrWwO0/gPpXnMDb05zgexjnw4x0fj83/4UTtH1dQ7XgRXUTGxD2mjth4ZVON4LRAvLwY+6s1IbhTPPu38LpbeFQG6eW2u1N379/ImvfAgsuc8YfGh6gM7G8aZCKcP54eHm9McYVPWK7MaYQuAToBcbohJaYMWYZTjDvAqKTx2PAp4EbcZq8R1+zECe0HyMFPeustZOqOX/leBvReTx0DofzgUCIZw42ce+2eh7e3TCiKfqgCxaUceu6Wm5eM4uyOIE13qjrA4EQgWCIoy293LXlxIjj3b6J979p7vax81QHu+o7OXL8OJcd/za3BP7gNOsNOxGq5M7Ae3g0NLKXRHVhNm9cUMeq2iJW1xWzsrYoqVGuF1UW4DIQsnCspQf/Y1/AG92kafnrnT9e4YHMYiRoam6tpdsXSDiqeHvvAN3d3cxpeYZNHQ9znu9lvAQY/p3vsdn8PnQ+dwcv5bn+VQS7Bv9/OM/NBgjnyCJ6cBLg2L+Aa2jhUvdOLnHt5FLXTipN4nRnMbSXrKJz1iUMzLsc7/yLWFNYyCW53vgj9D/1SCScR+RV4L79e/C/b4jd3xX1QZBxwbp3wBV/6/ShG7TgyvBrstBV73yNQ9BbSHf+HJq9tZygmgMD5bzWW8ar3aWctmUEe5MPXbOKc5hXnseCinzmleezqHg5oXu/hisU7n938YfxtB1LXLtpXJBf5YxcXljjvCGMrNdw648O0mhLaKbY6Vs/Ba12c7wuSnKz2O65itt6n8NNiPrshRwv2UxDxUX01JxPfmExF+R6uT4vi+JcL8W5XopyPHjc4Tdj9ir4Q6vTJLRuE6x8A7nzLmGxO8Gfvrmb4c3fcwYw9GRH1RwM1jrkjb0vTnDqbu/jTV94bMzXXJ6fxZyyPOaV57GkLC+8ns+88jwqC7KnbnT/VLn9e87AREHf6ME6mdrMmeRtP4HGPeEwniEBaSqsfYszMJq16f1AJNXyyuB9vxu5/8K/cL7SadVtYw9Gl2lcrrFnykjmXouuHvu8c01WHsy7ON2lSN7g+wmJa9Lh3Fp7yBjzMM6I7B/C6Rs+6LM4Nd3/Za2NdDIzxiwPX7s3at8CoMNa2xp9f2NMJTDYueYX1troqpUncaZau9wYc+vgXOfGGBfwxfA537F28kk4Zho1jyvpN0nRTdrBGQ/nXBIKWV480sq92+t5cOdp2nvjh+Q1dcXcuq6W16+bxazi0T999sT5NwhZaOjy8ZU/7Is0i68pyuFMp9Medzx9zq21NHQ6QXxnfUekj/iZzn4MId7mfoJPe35BqemO5Euf9fKd4C38Z+BWAq5sltcUsKaumPVtpRDOaHdcvxQ2rB/z+YnkeN3MLcvjaEsvf+a6D+9TQ4O/2SU30Pm6/8a/7edUxLn20S07uP/Atkgf7aGm436CcfoPGEJcYPZxm/sZXud+kSIzsul1wLp4OrSG3wYv5Q+hjfSRuBbXR1akj3e2CVCXb8jNL6AkXGNZHO6TXen1sax/O/M6Xqam+XnyOseYAbF0vvOBxMKrMAsupzSvjHFP4OSO86byxi/A/MsTX7PqjXDlp6AyTmOd/HKnLIcfH3mssBbKFkDpAk6ZKr744gDHbBXHbDXt/QXQldzvE2Ogtjg3HL7zmB8OcPMr8plblhe/FrX/n+CZr8Cat8C1n3MGMKpe7dxsWPgmv2LU8PSaHV+/S4/LOKE5zwnOJeEA7ezLitlXkjd0rCjXG/UaroHu9wCG2oJKapP9Rl3/T8lcAWtud75SqK4kl7+8chE/ffE4xble5pWHg3c4iM8py2NuWR6FqZqSLl1yip3gdq5ye2HW2nSXYnqks+ZeROQslqoB4f4SeA74hjHmGpzAvBlnDvT9OLXb0faEl9HvSK8AvmOMeQanprsVmAvcjNN3fAvwt9E3sdYGjTHvx6lB/5Ux5lfAceAaYBPwLE5f9UmLrTWfyGBwMZ85xA1EZxtrLTtOdXDPtnp+91o9DZ3xq9cWVubzhnV13LJuFgsrx9/cyZ2gqdLvd57hgR1nItv/76blkb7aw/ucW2s52dbHrnongO841cGu+g6au0eO8LnGHOafvD9gvSs2ML7s3cQTCz9B7cIV3FVbzLKawqFgcXdhJJynwuKqQq5q/zWf9A4F8+dYx/t3/hG+HU/wJtcBvhInc544foTfBE6Nef8l5iRvdD/DG9zPUmda4p6zLbSI3wYv5SFzMTavgpLcLNbkeSNBu2QwdEUNhFac68Xz01LodZrXP/vR85zmbkG/04zw8CNOqD25ZfQRl3NLYcEV4UB+pRN4J8qdHbu9+FonlBkDZYugNerfeckNcPWnYda60e/5xv9yBsUzLihd4JSvZF7M9F8VgSC/f/nhMUfld7sMs0tzmVeez/zyvJjlnLJcsj1J1jxe+EHna1B+BVz5d8ndI+xnf7aZd/zPiwC87+L5rJhVGAnVJblZFId/HvKy3JhU1BgWTHzk9Ezxtzcu529vXD72iSIiInLOSkk4D9eebwI+h9PE/GbgNPB14LPW2vjD48baijO/+UbgPKAIpxn7DuAunNr3EYnJWvuiMeZ8nFr664FCnKbsnwO+YK1NSYPL2JHak3tT7A+G2HaiPWbf2dzn/GDj0FzkR1viD3ZVW5zDLetquWVdLatqiyb0Bt7rjn/Nlx8a6j9885oaLl5cHtlu6/Vz3/b6mBrxjr7Rm7qX0MUnPHfxR+7HYpqwDxTOwdz0Bc5f8TrOT1T+6N0p+Dd/Cw9zg/fHke3ngyv5Y/9f48NJ5MEEI3VVxhkEbNC8rA5u977AzTzNomD8HiC9+XNoWXQbAytup6Z2OZ/M8/LZZPu45pVEwjkvfNuZWu7oM0NzyMbjzoa5FzpBfNFVzsByqWoOG90c05sHr/v3oaanb/1f+OHNThOX994DdXEncxipsBou+tCop2R73HzoysV847EDGGBuuPY0Er4r8plfnk9dSS5ZnszsK3fxogpe/fvr8LjNzK/tFREREckQKZtKzVp7Anj/OM8dkWSstTuA903w2buBKW1LN5nB4HbXd9Lvj60lO9tGaz/Z1st9209z7/Z69pyOP9JzeX4WN6+Zxa3ra9k4t3TS/Sfj9iOGyFzybpfh49cvozB7KDx09Pn58M9fjXtdtPwsN6tnFfKunKe5/vS3yR5oj3pwNlz612Rd+rFxDPwSk87HfO6oXvkxNxz5YmTz5dBS/sR/B/1Oj24Ksz0UZ+VCnM8aNpb5+bfL1lKa59Rkl7n7qTz5MAX7foPr6FMQjFO23DJY/SZY+zbyZp9P3mRrQHNKhtYHp1yKp2btUBifc6HTp2oqzL3YadoeHIDrPuc0kY+UYTV84jBgp6T55kevXcKfX74Qr9sM9Y+eYRINXCgiIiIiE5NR85xnsskMBhc9v/mgs6HmvLnbxwM7TnPPtnq2xnmNAAXZHm5YVcOt62u5ZFF5SoNIvD7n0d6ycTaLKguw1pLtceFL0Iy4KMfD6rpi1tQVs6qumNW1Rcz3HcD14MfhWOxIzyy53umXXL4oVS9jfF67C+79cGSzo2wtnpt+yn0lZZSEmxN73S7Y1QdxZoCqcXfw1vNq4OCj8PIvYd8DEOgfeaInB5bd5Ex/tuia1A72kx+vNzxQPBcWXekE8gVXJD4v1aqWw4decmrua9aMPJ5o0LAUyZ3AdIwiIiIicvZSOB+n6Jpzb5I151uH9TeHmdvnvLM/ei7ylrivI8vj4prlVdy6rparlldN2RQ/ifqcD5bho9c6M+kZY3jfxfP5r6cOU5afFZ62rIg14SnMZpfmDjWr722Fx/4etvyAmJru4rlw0xed4JpMDXL0uRP9QGbXb+G3HxgqT81ait97L+flxhn6zJXgv3T7cfj3Zc7UFSMLCQsudwL5ilsgp2hi5RzLxvcPjYK94PLIQG6ULUzfSMaT6bMuIiIiIpJCCufjNNGac2stW46OrFWeSc3a+/1BHt3TyL3bT/H4vqa4A1m5XYZLF1dw67parl9VPS39UBP1OQdnkKro0d4/efMKPn79MrxuE79/eygEr/4YHrnTGcV6kDsLLvlruPRjU9e8ejR774df/2lknmyqVsG773YGRosnUTgPBUYG8+o1sPatziBoRUmNgT0xS6+HT4WnJDub5x0VEREREZkAhfNxmuiAcCda+2jscsaky/K4IsE205u1+4MhnjnY7MxFvusMPQnmIj9/fmlkLvLyguy450yVRH3OC7M9/MUVI5udJxxcq/5VuP8OOLUldv/i65za8kk1YZ9En/MDf4C73usEa4CKpfCeu50puxIZa7C0ojpnKq21b4XqVcmVJxUUykVERERE4lI4H6eJNmuPnkLtvDklvHjE2c7Eec5DIcvLR525yB/YcZq2BHORr6otCs9FXktdyVgDok2d4Y0P7rxlJQ/sPMNfXrlofINV9bbCY/8MW77PiCbsN/4rLH9d+ppbH34CfvFOCIX/DcoWwnvuHXtKqeHh/JKPOtOTlS10mq3Pu0QBWUREREQkAymcj9NEm7VHDwa3eUFZJJxnSs25tZadpzq5d/spfvfaaU53xBkkDFhQkc+t4anPFleNfy7yqdTaEztL3vsuWcD7LhlHH+JQCLb9xGnCHt3U253lhNlL/yZ1Tdgn0uf86LPws7dDMPz6SubCe++DolnjeN6wn80N73VGIhcRERERkYymcD5OE23WvjWqv/kFC8qBg0D6B4Q71NTNvdvquW97PYebe+KeU1OUwy3rZnHrujpW101sLvKp1Nw1Ytr7sdVvg/s/HqcJ+7Vw079NwSjsSX7PTrwEP3srBPqc7aI6J5gXzx7f9XZYk4zxXiciIiIiImmlcD5OE5nnvKPPz/7GLsDpH33e3JKY46GQnfRc38mob+/jvu313Lu9nl318eciL83zOnORr6vl/Pll01q+ZDV1+8Y+aVBfm9OE/eXvEduEfY4zNdq0NGEf4wOZU6/AT97sTO0FUFDtBPPo+bfH0t0Qu+2Z3nEARERERERkYhTOx2kizdpfOd4Wacm8YlYh+dke3C4TqTUPWosr2ZrVJLWE5yK/d3s9L8cZNR4gP8vN9eG5yC9dXOHMlz0DvG3TnMj86q9bm6DJdygE234Kj/zjyCbsF38ELvv41I7CPt5m7Wd2wI/fCL7whyZ5FU4f82Rr8us2Dq3nTdN84SIiIiIiMmkK5+M0kZrz6Cbtm+aVAeA2hmC4BjUYskzFFOBd/X4e3tXAvdvreeZgc8K5yK9aVsmt6+q4enkVuUk01c8Ut51Xx+7TnXT2+/nM61aOPKF+GzxwB5x8OXb/omvg5i9NQRP2CWrcA//7Buhvd7ZzS+E990DV8uTvVbEEbvhXOPYsXPWplBZTRERERESmjsL5OEXXnHvHGWSjR2rfOM+Zl9rlAsI5P5TCQeH6/UEe39vIvdvreWxvI744c5G7DFwSnov8htU1FE3DXORTKcvj4s5b40wH1tcGj30etnwvtg928ZzwKOyvn8ZR2Md4TvNB+NGtQ7X62cXOPOY1qyf+yIv+0vkSEREREZEZQ+F8nJKtOfcHQ2w70R7Z3jTfCefuqFA42UHhAoNzkW+v5+FdDXT7AnHP2zhvaC7yysKzuA9yKATbfwZ/+EfobR7aP11N2JPVehh+dAv0NDrbWQXw7t9A7fq0FktERERERKafwvk4+ZPsc767vpN+v3NNXUkus4qd+cBdUeF8Itk8FLJsPd7GvducuchbeuKPWL5iVlF46rNZzC7NoEA6VU5vh/vvgJMvxe5fdDXc9CWoWJyeciXqc95+3Kkx76p3tr158M5fwexN01s+ERERERHJCArn4xTwJzeVWvT85oO15kDM6OehcaZzay276ju5b7sz9Vl9grnI55fnceu6Wm5dX8viqsJx3XvGS9SEvWi204R9xS3T2IQ9njjP7qx3asw7Tjjbnhz4o1/AvIumt2giIiIiIpIxFM7HKdlm7Vuj+ptvmjcUzt1R4Tw4Rp/zw03d3Bue+uxwU/y5yKuLsnn92lpuXVfL2tnFGTcX+ZQJhWD7z+EP/xDbhN3lhUsGm7Dnp698cVnoanCCedtRZ5c7C97+U1h4RVpLJiIiIiIi6aVwPk7JDAhnrWVL1EjtG8MjtcOwZu1xas5Pd/Txu+3O1Gc7TnXEvX9JnpebVjtzkV+woCwm8J8TTr/mjMJ+4sXY/eluwh5P9IclPc3OqOwtB51tlwfe+r+w+Nr0lE1ERERERDKGwvk4JVNzfrKtj8YuHwCF2R6W1Qw1MY+eQnyw5ry1ZyBqLvLWuNNh52W5uX5ldXgu8kqyPDNjLvKU6muHxz8PL383ThP2f4EVt6a5CfsYnv53sOGfI+OG278Py25Kb5lERERERCQjKJyPU8yAcGNMTh49hdr6uSUxNdvRo7Xfu62e5w+38MyBZgLx5iJ3u7hiWSW3rqvl2hXVM3Iu8pQYrQn7xR+Gy+/IwCbsg6IHhAsO7XvTf8PKN6SlRCIiIiIiknkUzscptuZ89JD8clST9k1RTdohdkC4f31w74hrXQYuXjQ0F3lx7syei3zSEjVhX3gV3PwlqFiSnnJNxhu+BWtuT3cpREREREQkgyicj1MgZiq10ZuUbz0af6R2AE+C/uHnzS3h1nW1vG7tLKoKcyZR0rNEXzs8/i/w8v8Ma8JeFx6FPcObsA8yw35WXv81OO+daSmKiIiIiIhkLoXzcYquOR9tQLiOPj/7G7sAZ2T29XNKYo5vml/G0ZZeAJbXFHLLOmek9Tll58Bc5OMRCsFrv3CasPc0De13eeHiv4LLP5HBTdjjmHMBvPhtZ/3GL8Km96e3PCIiIiIikpEUzscpFHT6hBuXweVJXGP7yvG2yIBuK2YVkp8d+y3+1zet4eY1NcwuzWNp9TkyF/l4ndkB998BJ16I3b/wSrj5yzOzCfvqN0FRLXhzYda6dJdGREREREQylML5ONiowdo8Wa5R5xLfOkp/cwCv28XVy6tTW8CZrq8dnvhXeOm/RzZhv+FfnIHTZkIT9kTmXpjuEoiIiIiISIZTOB+H6KnNxhoMLnqk9o3zSkc5U7AWtv8C/vD3I5uwX/Qhpwl7dkH6yiciIiIiIjJNFM7HwUalc+8og8H5gyG2nWiPbA8fDE6inNkBD3wCjj8fu3/hlXDTl6ByaVqKJSIiIiIikg4K5+Mw3prz3fWd9PudZtl1JbnMKs6d6qLNPP0dzijsw5uwF9bCjf8CK2+b2U3YRUREREREJkDhfByia8493sQ151uOJZ5C7ZxnLbz2S3j476GncWi/yxNuwv63asIuIiIiIiLnLIXz8Yiq4B2t5nxrVH/zTepvPuTMTnjgjpFN2BdcATd/CSqXpadcIiIiIiIiGSJxNXCSjDGzjTHfN8bUG2N8xpijxpivGWPGlVKNMfnGmHcaY35mjNlrjOkxxnQZY7YYYz5ujMlKcJ0d5euFeNckK6bmPEE4t9ayJWqk9o1xRmo/5/R3wIP/D/7r8thgXlgLt/8A3nOPgrmIiIiIiAgpqjk3xiwCngOqgHuAvcAFwEeBG40xl1hrW8a4zWXAT4BW4HHgbqAUuBX4MvAmY8w11tr+ONceA34YZ//JpF9MHNF9zhMNCHeyrY/GLh8AhdkeltWcw3OYWwuv3QUPf0ZN2EVERERERMYhVc3a/xMnmH/EWvvNwZ3GmK8AHwM+D3xwjHucAd4F/J+1diDqHncATwAXAx8C/j3OtUettXdOovyjGk/NefQUauvnluB2naODmjXsgvvvgOPPxe5fcDnc/GXVlIuIiIiIiMQx6Wbt4Vrz64GjwLeGHf5HoAd4tzEmf7T7WGu3WWt/Gh3Mw/u7GArkV062vBMRO1p7/G9ZdJP2Tedik/b+Dvj9J+E7l8UG88JZcPv34T33KpiLiIiIiIgkkIqa86vCy4etjZ4bywnWxphnccL7hcCjE3yGP7wMJDheYoz5Y6AG6AC2WmtT0t8cwIbGrjnfeq6O1G4t7Pg/pwl7d8PQfpcHLvxLuOJvIfscbuIvIiIiIiIyDqkI54PVofsTHD+AE86XMvFw/sfh5e8THF8HfC96hzFmO/Bua+2O8TzAGLM1waHljFFz3tHnZ19DFwBul2H9nJLxPHLma9gFD3wCjj0bu3/+ZU4T9qrl6SmXiIiIiIjIDJOKcF4cXnYkOD64v2QiNzfG/BVwI7AN+H6cU74C/Brnw4F+YDnwd8DtwGPGmPXW2lMTefagsfqcv3K8LdL0fcWsQvKzz/IZ6vo74YkvwIvfARsc2l84C274PKx6E5hztM+9iIiIiIjIBGR0ijTGvAn4Gs5gcW+21vqHn2Ot/fiwXVuAtxhjfgW8GbgDZ1C6UVlrNyYow1Zr2TC47Y0TzreeK/3NR23C/hdwxd+pCbuIiIiIiMgEpCKcD9aMFyc4Pri/PZmbGmNuA34BNAJXWWsPJ1mu7+CE88uTvG6E2Jrzkc3ao0dq3zjvLO1v3rAbHrhDTdhFRERERESmQCrC+b7wcmmC40vCy0R90kcwxrwF+BlOjfnV1toDEyhXU3g56ijx4xE9zN3wZu3+YIhtJ9oj22fdYHD9nfDkF+GFb8c2YS+ocZqwr36zmrCLiIiIiIhMUirC+ePh5fXGGFf0iO3GmELgEqAXGNfo6caYdwI/Ak4xsRrzQReGlxO9PiK65nx4s/bd9Z30+52XXFeSy6zi3Mk+LjNYCzt+FW7CfmZov8sDmz8IV/4/NWEXERERERFJkUmHc2vtIWPMwzgjsn8I+GbU4c/i1Fz/l7W2Z3CnMWZ5+Nq90fcyxrwXZ9C3YzjB/NhozzbGrAX2DO+LHt7/+fDmTybyumKMMlr7lrNxCrXGPXD/HXDsmdj98y+Dm78EVSvSUy4REREREZGzVKoGhPtL4DngG8aYa4A9wGacOdD3A58edv6e8DLSHtoYcxVOMHfh1Ma/34xsLt1urf1a1PbfALcYY54GTgA+nNHabwTcwP8AP5/kaxt1tPatUf3NN830/uZqwi4iIiIiIpIWKQnn4drzTcDncILxzcBp4OvAZ621baNdHzYPJ5jD0Lzmwx3DGb190N1AEbAWuBrIAVqAB4H/sdbem9QLSSDRgHDWWrZEjdS+caaO1G4t7Pw1PPTp2Cbsxj00CntOUfrKJyIiIiIicpZL2VRq1toTwPvHee6I6ldr7Q+BHyb5zLtxAvqUsjHN2odqzk+29dHY5QOgMNvDspoZ2Ae7cQ888Ak4+nTs/nmXOk3Yq1emp1wiIiIiIiLnkIye5zxT2FD8mvPoKdTWzy3B7ZpBTb59XfDEF+DF70AoMLS/oBqu/zysuV1N2EVERERERKaJwvk4RNecR4/WHt2kfdNMadI+2IT94c9A1+mh/WrCLiIiIiIikjYK5+ORYEC4rTNtpPbGvfDAHXGasF8CN39ZTdhFRERERETSROF8HGL6nHudZu0dfX72NXQB4HYZ1s8pSUPJxsnXNTQK+4gm7P8Ma96iJuwiIiIiIiJppHCeBLfXhQn3K3/leFsktK+YVUh+dgZ+K0drwr75g3Dl/1MTdhERERERkQyQgYkyc0UPBrc10/ubJ2rCPvdieN2XoXpVesolIiIiIiIiIyicJyFmMLiokdo3zsug/ua+Lnjy3+CF/4xtwp5f5TRhX/tWNWEXERERERHJMArnSRgcDM4fDLHtRHtkf0YMBmct7PoNPPQZ6Kof2m/csPkD4Sbsxekrn4iIiIiIiCSkcJ6EwWbtu+s76feHAKgryWVWcW46iwVN+5wm7Eeeit2vJuwiIiIiIiIzgsJ5Ejxep+Z8S6ZMoebrDo/CribsIiIiIiIiM5nCeRK82U7N+dao/uab0tHf3FrY9Vt46NPDmrC74IIPwFWfVBN2ERERERGRGUThPAmeLDfWWrZEjdS+cbpHam/aH27C/mTs/rkXwc1fhprV01seERERERERmTSF8yR4stycbOujscsHQGG2h2U1hdPzcF83PPUleP5bEPIP7c+vguv/Cda+TU3YRUREREREZiiF8yR4slwxU6itn1uC2zXFgdha2H2304S989TQfjVhFxEREREROWsonCfBk+WOadK+aaqbtDfthwc/AYefiN0/50JnFPaaNVP7fBEREREREZkWCudJ8Ga52DodI7UnbMJeCdf9E6x7u5qwi4iIiIiInEUUzpMQMLCvoQsAt8uwfk5Jah9gLey+Bx76VJwm7H8OV34SclP8TBEREREREUk7hfMkNPQMYK2zvmJWIfnZKfz2qQm7iIiIiIjIOUvhPAknO/si6ynrbz7Q4zRhf+4/4jRh/xysfTu4XKl5loiIiIiIiGQkhfMkHG7vjaxvnDfJ/uaRJuyfhs6TQ/uNC87/M7jqU2rCLiIiIiIico5QOE/C4dZecDvrkxoMrvkAPPAJOPx47P45m+HmL8OstRO/t4iIiIiIiMw4CudJ6A2FwA11JbnMKs5N/gYDPfDUl+G5b8Y2Yc+rcJqwr/sjNWEXERERERE5BymcJyEQXiZda24t7LkXfv+pOE3Y/xSu+rSasIuIiIiIiJzDFM6T4DfOUO2bkulv3nzQGYX90GOx+2dfAK/7dzVhFxEREREREYXzZASMs9w4npHaB3rg6X+HZ7+hJuwiIiIiIiIyKoXzJPiBwmwPy2oKE59kLey5D37/yZFN2Df9CVz9acid5EjvIiIiIiIiclZROE+C31g2zC3B7TLxT2g+CA/+LRx6NHb/7AvgdV+GWeumvpAiIiIiIiIy4yicJ8FvYFO8Ju2DTdif+yYEB4b255WHm7C/Q03YRUREREREJKGUJUZjzGxjzPeNMfXGGJ8x5qgx5mvGmKTacBtjysLXHQ3fpz5839lT/eyxBBg2UvtgE/ZvbXbC+WAwHxyF/cNb4bx3KZiLiIiIiIjIqFJSc26MWQQ8B1QB9wB7gQuAjwI3GmMusda2jOM+5eH7LAUeA34BLAfeD7zOGHORtfbwVDx7LEEsxm1YP6fE2dFyyGnCfvCR2BNnnw83fxlq10/2kSIiIiIiInKOSFWz9v/ECccfsdZ+c3CnMeYrwMeAzwMfHMd9/gUnmH/FWvvxqPt8BPh6+Dk3TtGzRxUAVswqJN8MwKP/Cs99Y2QT9ms/C+vfqZpyERERERERSYqx1k7uBk7N9UHgKLDIWhuKOlYInAYMUGWt7RnlPgVAIxACZllru6KOuYDDwLzwMw6n8tljvL6tcyqWbPjQ7d9m3kX7eHvLt6HjePQZcP6fwFWfhrxxTLEmIiIiIiIiGWPjxo288sorr1hrN6azHKmo4r0qvHw4OhwDhAP2s0AecOEY97kQyAWejQ7m4fuEgIeGPS+Vzx5TqWnj7Yc/GRvM6zbBnz8Or/t3BXMRERERERGZsFSE82Xh5f4Exw+El0un4D6pevaYCl1RnxfklsGt34Q/+QPUnjfZW4uIiIiIiMg5LhV9zovDy44Exwf3l0zBfVL1bIwxWxMcWg7gMT7AwKY/hqs/o5pyERERERERSRnNcz5OAbfHacKumnIRERERERFJsVSE88Ha6eIExwf3t0/BfVL1bBJ1/jfGbM3J822oeOO1UDt/rNuIiIiIiIiIJC0Vfc73hZeJ+nUvCS8T9QufzH1S9exRFVZUcN0V8ydzCxEREREREZGEUhHOHw8vrw9PeRYRns7sEqAXeGGM+7wA9AGXhK+Lvo8LuH7Y81L5bBEREREREZG0mXQ4t9YeAh4G5gMfGnb4s0A+8OPoecaNMcuNMcuH3acb+HH4/DuH3eevwvd/aHCO84k+W0RERERERCTTpGpAuL8EngO+YYy5BtgDbMaZh3w/8Olh5+8JL82w/Z8CrgT+xhizHngJWAG8AWhkZACfyLNFREREREREMkoqmrUP1mBvAn6IE4w/DiwCvg5caK1tGed9WoCLgG8Ai8P32Qz8ANgYfs6UPFtEREREREQkXVI2lZq19gTw/nGeO7zGPPpYK/DR8FfKny0iIiIiIiKSaVJScy4iIiIiIiIiE6dwLiIiIiIiIpJmCuciIiIiIiIiaaZwLiIiIiIiIpJmCuciIiIiIiIiaaZwLiIiIiIiIpJmxlqb7jJkNGNMS25ubtmKFSvSXRQRERERERFJsT179tDX19dqrS1PZzkUzsdgjPn/7d15jF1VHcDx7y+UgKwighDbyKKyhEAQBVsitKhVFLCaQjBhcaGKURCkgHFBNFHABCyLEREJKCQgm7iArUhlsQqiRSHIFqjKFqBlFVoEfv5xzgvX13nTdtp59035fpKTO+/cc6fndX5z5vzePffeJcAawN/a7ou0krat27ta7YW0coxjrS6MZa0ujGWtDnYCXs7MtdrsxLg2//Ex4g6AzNyl7Y5IKyMi/gLGssY241irC2NZqwtjWauDThy3zWvOJUmSJElqmcm5JEmSJEktMzmXJEmSJKllJueSJEmSJLXM5FySJEmSpJb5KDVJkiRJklrmmXNJkiRJklpmci5JkiRJUstMziVJkiRJapnJuSRJkiRJLTM5lyRJkiSpZSbnkiRJkiS1zORckiRJkqSWmZz3EBHjI+K8iHg4IpZExIKImBURG7XdN6kpIjaOiMMi4sqIuC8iXoiIpyPipoj4dEQM+XseEZMi4uqIWFSP+XtEHBURa/T7PUi9RMRBEZG1HNajzT4R8fsa989FxM0RcWi/+yp1i4j31rH50TqXeDgiZkfEh4Zo65isgRMRH46IORHxYI3L+yPi0oiY2KO9caxWRMT0iDgzIm6MiGfqvOHCZRyzwvE62nOOyMxV9b1WGxGxNTAP2BS4CrgL2BWYAtwN7J6ZC9vrofSqiDgc+AHwCDAX+BfwJuBjwIbA5cD+2fhlj4iP1PrFwCXAImBfYBvgsszcv5/vQRpKREwAbgfWANYDZmTmuV1tvgCcCSykxPKLwHRgPHBqZs7sa6elKiK+CxwLPAhcAzwBbALsAlybmcc12joma+BExCnAcZTx9eeUGH4rsB8wDjgkMy9stDeO1ZqIuA3YCXiOMu5uC1yUmQf1aL/C8dqPOYfJ+RAiYjYwFTgyM89s1J8GHA38MDMPb6t/UlNE7AWsC/w6M19p1G8G3AJMAKZn5uW1fgPgPkrivntm3lrr1wauAyYCH8/Mi/v6RqSGiAjgt8CWwBXATLqS84jYgvLh6X+AXTJzQa3fCPgzsDUwKTP/2NfO6zUvImYA5wAXAJ/JzBe79q+Zmf+tXzsma+DUOcRDwOPAjpn5WGPfFEpsPpCZW9U641itqnH5ICUO96ScsBoyOR9JvPZrzuGy9i71rPlUYAHw/a7d36D8QA6OiHX73DVpSJl5XWb+spmY1/pHgbPry8mNXdMpZ28u7gxGtf1i4Gv15edGr8fScjkS2Av4JGXcHcqngLWAszp/JAEy80ngO/WlH6SqryJiLeDblFVMSyXmAJ3EvHJM1iB6CyVPuLmZmANk5lzgWUrcdhjHalVmzs3Me5srRYcxknjty5zD5HxpU+p2zhDJzrPAH4B1gHf3u2PSCHQmgC816vaq298M0f4G4HlgUp1gSn0XEdsBJwOnZ+YNwzQdLpav6Woj9cv7KZO+K4BX6jW7x0fEF3tcp+uYrEF0L2XJ7q4R8cbmjojYA1gfuLZRbRxrLBlJvPZlzmFyvrRt6vaeHvvvrdu396Ev0ohFxDjgkPqyOZD0jPHMfAl4gHIt2Vaj2kFpCDVuf0o56/iVZTQfLpYfoZxxHx8R66zSTkrDe1fdLgbmA7+ifNg0C5gXEddHRPOMo2OyBk5mLgKOp9zD5s6IOCciToqInwFzKJcdfbZxiHGssWQk8dqXOYfJ+dI2rNune+zv1L9+9LsirZSTgR2AqzNzdqPeGNcgOwHYGfhEZr6wjLbLG8sb9tgvjYZN6/ZYIIH3UM4y7khJavYALm20d0zWQMrMWZSby44DZgBfBvYH/g2c37Xc3TjWWDKSeO3LnMPkXFoNRcSRwDGUG1cc3HJ3pOUSEbtRzpaf6k3cNIZ15lYvAftl5k2Z+Vxm3g58lHLDoj17PYpKGhQRcRxwGXA+5WZX61KeNnA/cFF9IoGkVcjkfGnL+tSjU//U6HdFWnH1MQ+nA3cCU+rStCZjXAOnLmf/CWW52NeX87DljeVen3JLo+Gpup3fvGkQQGY+D3RWMu1at47JGjgRMRk4BfhFZn4pM+/PzOcz86+UD5keAo6JiM6yX+NYY8lI4rUvcw6T86XdXbe9ril/W932uiZdak1EHEV5/uIdlMT80SGa9YzxmiBtSTnjc/8odVMaynqUmNwOWBwR2SmUJ2UA/KjWzaqvh4vlzSlneR6sCZHUL524fKrH/ifr9nVd7R2TNUj2qdu53TvqmHoLJY/YuVYbxxpLRhKvfZlzmJwvrTMITY2I//v/iYj1gd0pd/D7U787Jg0nIo4HvgfcRknMH+vR9Lq6/eAQ+/agPI1gXmYuWeWdlHpbAvy4R5lf29xUX3eWvA8Xy3t3tZH65XeUa823755HVDvU7QN165isQdS5S/UmPfZ36juPCjSONZaMJF77M+fITEtXoSw5S+CIrvrTav3ZbffRYmkWyjLgBG4F3rCMthsAj1OSoXc26tcG5tXvc2Db78li6RTgxBqXh3XVb0m5I/ZCYItG/UbAffWYiW333/LaK8BVNf6O7qqfCrxCOXu+Ya1zTLYMXAEOqLH3KPDmrn171zh+Adi41hnHloEpwOQacxf22L/C8dqvOUfUb6qGiNia8oPZlPIH9h/AbpRnoN8DTMrMhe31UHpVRBxKuVnLy5Ql7UNd67IgM89vHDONcpOXxcDFwCJgP8pjIi4DDkgHBw2IiDiRsrR9Rmae27XvCOAMyh/LSyhncaYD4yk3lpvZ395KEBHjKfOICZQz6fMpE7tpvDrpu7zRfhqOyRogddXHbOB9wLPAlZREfTvKkvcAjsrM0xvHTMM4Vktq/E2rLzcDPkBZln5jrXuiOScYSbz2Y85hct5DREwAvkVZurAx8AhlYPpmZj453LFSPzUSl+Fcn5mTu47bHfgqMJHySeF9wHnAGZn58qrvqTQywyXndf++wEzgHZTLte4EzsrMC/rZT6mpPsv8BMpkb3PgGcok8aTMvGWI9o7JGigRsSbweeBAYHvKUt9FlOvNz8jMOUMcYxyrFcsxH/5nZm7RdcwKx+tozzlMziVJkiRJapk3hJMkSZIkqWUm55IkSZIktczkXJIkSZKklpmcS5IkSZLUMpNzSZIkSZJaZnIuSZIkSVLLTM4lSZIkSWqZybkkSZIkSS0zOZckSZIkqWUm55IkSZIktczkXJIkSZKklpmcS5IkSZLUMpNzSZIkSZJaZnIuSZIkSVLLTM4lSZIkSWqZybkkSZIkSS0zOZckSZIkqWX/A4iXSLlR/8dSAAAAAElFTkSuQmCC)



For certain quantities such as queue length or on-off status,
weighted average (with time intervals used as weights) makes
more sense. Here is a function that computes running time-average:

<div class="input-prompt">In[53]:</div>

```python
def running_timeavg(t,x):
    dt = t[1:] - t[:-1]
    return np.cumsum(x[:-1] * dt) / t[1:]

# example plot:
for row in somevectors.itertuples():
    plt.plot(row.vectime[1:], running_timeavg(row.vectime, row.vecvalue))
plt.xlim(0,100)
plt.show()
```

<div class="output-prompt">Out[53]:</div>


![png](data:image/png;base64,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wFeMMfcC54CbccbYvgj86Zj9zwWn4WpkY8zdOFnFXTi15B80Zlwtc6e19ksxKjMBn2q0RUREREREJLZiEmhba68YY/YCf44zFNdbgAbgy8BnrbUd0zhNBaM17B+aZJ9rOFnIY8LvVx9tERERERERia2YDe9lra0BPjjNfcdVH1trvwF8I1blmY5AVKCtGm0RERERERGZu2VdjRvZdFx9tEVERERERCQWlnV06VeNtoiIiIiIiMTYsg60AxreS0RERERERGJsWQfafp+G9xIREREREZHYWtbRZWSNttujGm0RERERERGZu2UeaGt4LxEREREREYmtZR1d+n3qoy0iIiIiIiKxtawD7cgabfXRFhERERERkVhY1tFlQMN7iYiIiIiISIwt60A7uun4sv4qREREREREJEaWdXSpGm0RERERERGJtWUeaEcO77WsvwoRERERERGJkWUdXapGW0RERERERGJtWQfaGt5LREREREREYm1ZB9oBn4b3EhERERERkdhattGltZZAQE3HRUREREREJLaWbaAd1T/bZTBGgbaIiIiIiIjM3bINtKP6Z3sUZIuIiIiIiEhsLNtAOzrj+LL9GkRERERERCTGlm2EGRlou1WjLSIiIiIiIjGyjAPtyKG9lu3XICIiIiIiIjG2bCNMv08Zx0VERERERCT2lm2gHVmjrTG0RUREREREJFaWbYQZnQxNNdoiIiIiIiISG8s20I4a3kuBtoiIiIiIiMTIsg20o7OOL9uvQURERERERGJs2UaY0VnHVaMtIiIiIiIisbFsA+3orOPL9msQERERERGRGFu2EWZkH223RzXaIiIiIiIiEhvLNtCOzjq+bL8GERERERERibFlG2FGJUNTH20RERERERGJkWUcaEckQ1PWcREREREREYmRZRthRidDU422iIiIiIiIxMayDbQja7TVdFxERERERERiZRkH2hE12mo6LiIiIiIiIjGybCPMyOG91HRcREREREREYsUT7wLES3TW8WX7vEFERCSmRvwBWnuH8LhceFwGt9vgcZnwssulh9siIrL0LeNAWzXaIiJL2nAf1B0FGwCXJ/jygssdsewBtyd6edzLDUZ/J65nyOfn6y9V8bVnL9Mz5Jt0P2PA63LhdpmIQDwYlLsMXrcJbnNFLYeE1nvC+0XvH152T7LeZXC7XLT2DlHZ2guAyzjb3MZ5EOAOLjvzTLAuOG8MbhcTrBuzfdy6iPdyXe/9DS4XU7x/9Dkmfy8mfH8REZkfyzbQjso6rj7aN5zeIR/DvgDJXjeJHtcNe7NwubmHk7VdeNwuEtyGBI8Lr3v0leB24fUYZ+p2RWw34e036meXObAW6o/DQAe4vU7w6BuEgC8YOHpHg0p3KLj0jM6Ht3tGj3d5wLXIfwvrjsH5nwQ/p3dMkBz6XG5nvrsOjvwT9LfF5r3HBt6uiO81MnB3TxDITxS4R/4bzPv5Ita5J3iPiR4+uNzQXQ9DPcEHDa7g1B0xDV4zxs0bdT186nunqeoYxI+LqXqmWQvD/gD4Y/NPI3PjHhPMu1yTBf2MXzfmgcRkgX7ogcOEDxoiHjhM/qAhtG7ihxpR2yd9/0keakzyQGK2Dz1cBkyMHsz1D/s4Ud3JSMDiMs77GuO8h9vlzA/5/Pj8FpcZfW9X8OGQyxBc77xMaNnFmP0j9o04zkQdH3Hu4GedaLuIjFq2gXZU03GPfhgWo9beIQLWkpboIdnrDv+A/+MLlfzFz84RGP0nJMnrItnrJtnrJinBHZ5PTnCT5J1kOcE5Jim4/nrHe90mpn9ETtZ28tD/e8W54ZwDj8uEg+/oQN2Q4HGT4Daj6zyu8HLkvuF9gusSPaPBfGTAPzrvCgf/3ojzJYTPYSK2u2L+3S2Icz+Gn/4hDPdGB6Rub8S8B+vyMhBw48cdXm/cHvAkYFxejMeLcQdfngRcbi/GnYDL48Xl9oI7YTT4CS1HBshR7xfc75n/CZXPxfwjW1wEXB6sy4M1wanLiw0GXzYieLMRQZuJKL+J+A7Cn9vtLLtcbkx3nRP8TifQjAwKBzrhxL87tdPxEPA5L5nQDuBpgCRnOYAhgAs/LvzWNTqPwY87OO8iYF2j87jwMbrv6DHBbXb8OmfeHb3OOu/jnM894TGh841dF7mfxRDA4A/OO5/DOW9oXxvcPrrehI8PWFf08Yw/fuxx1kYcz/SOh7n9troCIyQxiPU75/NhGI54/wAGG4P3WSxSGMRgw99l6N85EKPvEwgHwpMF9WlmgFzTQwEdGJcLjAsTfKBljAvjMljcVHcM0DdiJyxjwJoJPsPEn8lGzM/3v2dkcG8mDMqhnEZyTTfgfHaMCT7MM5gx60zU9tCys84YF8a4weBMXSa4bEa/1+C+LuPGOE8ggseNfteRDxoiH2REP2yI3h75cCHyAUv0vhHHBh+M+PwBTtd1MzjiD28fO3UZMDgPRKLfzwS/48hzBo8lukyj8xOXa+znwBgaOge43NyLDf47hsvA+GOcQ0LvH13eUFlCZSNqObhuTLlD54/+HJHvMX5f532D3wPR+3b0D8/L9T1TyzbQ9kc2HZ9lLY61luM1nTR3D5GS4CY10U2y10NKgpuURDcpCR5SvG7VOM7Cpx89xbcOV4eXjYEUrxu/tQyOjL/RHhwJMDgSoIOReSuT22UiAvOIwH6agXpUYO918/mfnptzkA3gC1h8AT8D8/fRYyIhFJR7IoL3MUF/ZEAfWk4YG/R7Jgjuox4uuKIeCHjdhvS+akpP/S2JfQ0Ylysc+IWCQFc4AA4GjQE/HPsm2OtXuRkgZf6/vgVhCOAODENgcfyBioURk0BtymZcxuKyfifsssHQzPpw22BoZZ1lZ+rHhOYDPgxxCu5vYC4sLvx48E99P68/j3MWCpz84W99kgcANvpBgN86N6dlpgWPuf41Hgrs/OFALjpwi3z4MC7Ii3iAELk98mGGs68rKmAM2PHvEbV9gjIEghfVRlPNatMAEUGohwCJ5vp/LP126iA1ejm6TNaa6OVQUOx3Yf2GTNNLiWmf3j+uC0ic3q4zFbAGC9P+nAn4SGJ4wv0m+jd15hn9ToLfS5IZoXi6n3+BRP57R14voc8Q+ZkjP68d8+8+9vsc+72ElvcEp0zwPjZ4/QZs6PsbPdfY973e+sh1oYczUx1bgCF/RueECtNELt0Tns/5TBHXQcTnYZLzWwzWRu/Pdcrjizh/6P18nfULeQlNKmaBtjGmDPhz4AEgF2gAHgU+a63tmMF5coD/DjwIFANtwOPAf7fW1saqvIGopuOz+0v/jy9W8oWfnr/ufkleF6kJHpIT3E4QnuCJmo4L0L1uUhKD2yY4LrQuYYk2eb/W1hcVZIPT1LBveHzQk+B2xSRYnQ5/wNI75KN3ir6Hs5HgcXHf5kJGfAFG/AFG/JZhf2g+wLAvuM43ui60vFCfPRaG/QGG/cAE/47z6QHXa/xdwpcW9D0XyquBjVgMnmBAM4QXn3XjMf7wOi9+PMF6PS8+PMZZ547a7sdrbox2vIcDm3jevwN3sMyRn8Md8Xk8xk+tzecbvoN0DGTM6T0NAdzBV+h79eAPL7vD32lwGT8eAnjw4TGB8LKbyO8+uN6MOVf4WH/43JMfG3wPot9j9NjRc05YvvB7T3SsZch6abZZjOB2Pr9xbiHdwVtJT8R8aLvXWMw0HlBJ7IRuL91c5+/B2FudGd76uIxzC+u53vtM570XObexuGfbt+EG+awu49wHz/pzzsQi/07m9O8dssg/43LzT6aXmngXghgF2saYNcAhoAD4IXAe2Ad8AnjAGHOrtfa6HeWMMbnB86wHngG+DWwEPgi81RhzwFpbGYsyRyZDc88yYH36bPO09nNqW4ehb1ZvMymv26lhTUnwBGvQI4P48QH9hPPB4yID+shm2vHwnddH/2skeFy4DONqsV0G/ulX93LPxkL8AcvgiJ/BET8DoelwgIHg8sDw6LaB4ch9/OF9opcDDEZuG/bTP+LHH9lWPYY+cuca/tt966e3s28IRvrD/SStcZo/jgRgxG8YDtiI4DwQDNiddSPBwDwUuI9uDwSDfBuxPTroj1w37LP4fSPc0vMzskeaGQkYfNYwYg0jgeDLGoYDziu0PVRj4bcTN9OMqmmJagI68fax84V0UGA6o54g55pu/tzzL7P+t6kMFPFrI39Er00OBnOhQNU3GqDiw4OfldleklwBTMAHgRHcdgQT8OEK+HDZEYz14w6MBGtRfRjrnCN0fHhqItc5QbIXH96I4LnfJvFN/338LHDzrD/bWJlJHm5ZnYUXPzYwgvH7sAEfxj8SbjZtrDNvAiOYgD84dT4j1oc74AvWBPswwdpgd3A5VGNssDTZbNrImDhwNf7wQ4HowNBPpS3hycBeAizsQ0aL06TZBwxNvMNUB8+7kswk/ujNG7lpbR6BgMUXsPgDloB15gMBi99afH7LcOS60MtGzIdf/uA2M+5cE52/LDuFt2wrxnhczpNRG3Bahlj/mGkgeD2NXRdajtwWGHO8b4J1EdOZvl/AN0kZQtuCf3esddaH9wlELAfGLIe2BybZ3x/b88WqK4Unyem2MtF72gALciEvpIS08Z8xlt/nNAQSMvCllxHwJIff244piwtLghvMuHLaMdPJtk/2GeP772k9SfhyN2Jd7ohrO4Bl7Oey48sdnDfWjm5n9HObyH0Y3ccEjzc2WE8a2i4yj2JVo/01nCD749bar4ZWGmO+CHwS+DzwkWmc5ws4QfYXrbWfijjPx4EvB9/ngVgU2B/RR3u2Wccj2//vKs8CYGDYT9+wz5kOOYHafHGCJR/dg7GtYTWG0QA+HJSPWU70RNW8Tyug97rxTDGU2qWmHo5UdfDd10cbLnz1F3dx/5Yi/AFL37CP/iHn+81NTSArJQFwmnSnJnpITZzfnhAj/kA48B6YMHAPRAXnkwX6g77RQH57WSYfu3vN9Apw4j/gx58A/+h1ZwBv8OWscEUnKwr2aYpOYBRcP1Fyo+ns73bD1aemV+apcyItuJ977+Jpz+34AwGs3wkUiQgkPeHA1s8wHn7sP0An6dEnmeDv8q8cqOCz79gy4wdU/oDFFwjgD1hG/Da87AvPW3z+QDiwGfEHGAlYTMDyy37L+653bMTySCCA3x+xPmDDy+sK03jP7jKSvO45fLvTExmo+a1TBr8d/R7GvnyB6IDwwwEnYBwf+AXwB8AXCDjb/BMHkb4J3iO0z+h5nXP5g99T6D1C5/W6XTywtYiDWwoJBAgfHwpoxwajo1Oi1oX2HVuOifYNRHyOyM+ekezlTZsK5/33b0aMGf3tkPkVDjZmGrgHA/6AHxJSILNsZu8z0SswyfrwMRMEf1FB/djtE72XneC4SV7eZFh5BySkjlmf4uTAmPKzXufcc9rHQs5qXIlpJMT2api+yCB1TAA75WdIzHD+f0+43xTfyZgA2mSU4E1IjdenjxZV7skD+wk/47jvbYIHBNfbZ+z2UJnGPnQIPzQYe9xE57FTnGOy5WnsP1E5EtMgb4Nz72iZ4n0mOCdM/n5Tff7pnP8//w801M3/9XMdc/7LHKzNPghUAX87ZvNngN8EPmCM+ZS1dtI6XWNMGvABnHrf/zFm8/8F/htwvzFmdSxqtQO+QHjePctAuzOiU+z/++U9FGUmjX+fgGVgxE//sD8chPcP++kfMw0F5v0jTjDZP+xnYMTnBOuRwXv4uPmrYbWW8HvEWoLHNUGTeDfN3UNUtkZfHnlpCdyzsQBwgumMJC8ZSd6JTrsgQv2AF7QMviFoPutkl37sU1FB9oTCNy+LvMP2QksvgQ8/wb1Z5dw7xW6hYHY4WMv/UX+AEV90U/4Rf4ChUKsAX4DsVC+7y7Nn1QrEyYK7vIIRl8uQoLwVIrFhghmD5vuJ5kK9z2IQelDEEv5tXk7/ntezHP69l6O0/wCWQKAN3B2cPmmtDURusNb2GGNexgnE9wM/n+I8+4Hk4Hl6xpwnYIx5AidovxuYe6AdVaM98x8aay2dETXaWSkTB1+ueapttda5+XeCbz8Dw05QPlGAHhnkj9t/ZHR+YMRP35CPIV/g+gWYpWGf0wy5s//6geB7967AO4t/m3kz1AM//B1oPDV+24RB1gTrxu03xT42AK0Xx293J4xp4hds6hiPJlCJmbD/I+PLMtHyhE1BI2olxjX7HLNvZC3GhPsGnJrpwi3gSRzdLykD7voTyCq/7scJBb4LUbMrIiIiIktXLKK/DcHpBBEBAJdwAu31TB1oT+c8BM8zJWPM0Uk2bQzN+COCydkkQ+sf9jMSDNaTvK4FvzE3xpDocZPocZMV45TH/oClPxiU908QoPePCdZDAfpk+/cFA/3+YR/TqYRfW5DG27eX8Ft3ro7tB5ur5/4Szj4a50IY+LWfwoqbxm8KNQO0kwS6UQHvRMFsYOJAOepcEfskpkHFrWoeKiIiIiIyRiwC7czgtGuS7aH1WQt0nmmJGkd7FrWmkf2zs5Lj1stmXrhdhvQkL+kxbiJtrWXIF3CC8SFfuEl9/1CwOfyInw2F6WwoSr/+yRaatdDTEL/3dydCyS7Y9f6Jg2xwasLdHpbxqH0iIiIiIovCkrwjt9bumWh9sKZ7N8D+B9ew454V+P0BCioyZvwe+emJ/PBjt9LRP0zAxqHJ7g3IGENScBzpnNQb7OGEMfDQ12H/x+DFv4H7Pstos+8J/v0nvCbszPcBSMmDtPyZlVdEREREROImFoF2qKY5c5LtofWdC3SeackrS5vT8YkeNztWZMWiKHIjKdsDv/gf8S6FiIiIiIgsYrHINHUhOJ2s7/S64HSyvtexPo+IiIiIiIhI3MQi0H42OD1ojIk6nzEmHbgV6AcOX+c8h4EB4NbgcZHnceEkVIt8PxEREREREZFFZ86BtrX2CvAksBL42JjNnwVSgX+LHEPbGLPRGLMxckdrbS/wb8H9/8eY8/xO8PxPxGIMbREREREREZH5EqtkaB8FDgFfMcbcC5wDbsYZ8/oi8Kdj9j8XnI4dV+tPgLuA/2aM2Qm8BmwC3gk0Mz6QFxEREREREVlUYtF0PFSrvRf4Bk6A/SlgDfBlYL+1tm2a52kDDgBfAdYGz3Mz8C/AnuD7iIiIiIiIiCxaMRvey1pbA3xwmvuOrcmO3NYOfCL4EhEREREREbmhxKRGW0REREREREQcCrRFREREREREYkiBtoiIiIiIiEgMKdAWERERERERiSEF2iIiIiIiIiIxZKy18S7DgjHGtCUnJ+ds2rQp3kURERERERGRGDt37hwDAwPt1trceJZjuQXaQ4AbeCPeZRGZo43B6fm4lkJk7nQty1Kg61iWCl3LshTsAPzW2sR4FiJm42jfIE4DWGv3xLsgInNhjDkKupblxqdrWZYCXceyVOhalqUgdB3Hm/poi4iIiIiIiMSQAm0RERERERGRGFKgLSIiIiIiIhJDCrRFREREREREYkiBtoiIiIiIiEgMLavhvURERERERETmm2q0RURERERERGJIgbaIiIiIiIhIDCnQFhEREREREYkhBdoiIiIiIiIiMaRAW0RERERERCSGFGiLiIiIiIiIxJACbREREREREZEYUqAtIiIiIiIiEkPLItA2xpQZY75ujKk3xgwZY6qMMV8yxmTHu2wikYwxucaYXzfG/MAYc9kYM2CM6TLGvGSM+bAxZsL/s8aYW4wxPzXGtAePOWmM+T1jjHuhP4PIZIwx7zfG2ODr1yfZ523GmOeC132vMeZVY8yvLnRZRcYyxtwb/G1uDN5L1BtjnjDGvGWCffWbLIuOMeatxpgnjTG1weuy0hjzXWPMgUn213UscWGMecgY81VjzIvGmO7gfcO3rnPMjK/X+b7nMNbaWJ1rUTLGrAEOAQXAD4HzwD7gbuACcKu1ti1+JRQZZYz5CPD/gAbgWaAaKATeDWQC/wU8bCP+4xpj3hlcPwg8ArQDbwc2AN+z1j68kJ9BZCLGmBXAKcANpAG/Ya39pzH7/A7wVaAN51oeBh4CyoC/sdb+/oIWWiTIGPO/gT8AaoGfAa1APrAHeNpa+4cR++o3WRYdY8z/Av4Q5/f1UZxreC3wDsAD/Iq19lsR++s6lrgxxpwAdgC9OL+7G4F/t9a+f5L9Z3y9Lsg9h7V2Sb+AJwAL/O6Y9V8Mrv+7eJdRL71CL+Ce4A+Da8z6Ipyg2wLviVifATQDQ8DeiPVJOA+YLPAL8f5cei3vF2CAp4ErwF8Fr8tfH7PPyuAfyDZgZcT6bOBy8JgD8f4sei2/F/AbwevvG0DCBNu9EfP6TdZr0b2C9xB+oBEoGLPt7uB1WRmxTtexXnF9Ba/LdcH7h7uC19y3Jtl3xtfrQt1zLOmm48Ha7INAFfC3YzZ/BugDPmCMSV3goolMyFr7jLX2x9bawJj1jcDfBRfvitj0EE6tyretta9H7D8IfDq4+NvzV2KRafk4zkOkD+L87k7kQ0Ai8H+ttVWhldbaDuALwcWPzGMZRcYxxiQCn8d50Pmb1trhsftYa0ciFvWbLItRBU530Vettc2RG6y1zwI9ONdtiK5jiStr7bPW2ks2GP1ex2yu1wW551jSgTbO0xCAJycIXHqAl4EUYP9CF0xkFkI3c76IdfcEp49PsP8LQD9wS/BmUWTBGWM2AX8JfNla+8IUu051Lf9szD4iC+U+nBu47wOBYB/XPzLGfGKSfq36TZbF6BJOs9h9xpi8yA3GmDuAdJxWRyG6juVGMpvrdUHuOZZ6oL0hOL04yfZLwen6BSiLyKwZYzzArwQXI38UJr3GrbU+4CpO36vV81pAkQkEr9t/w6kN/JPr7D7VtdyAUxNeZoxJiWkhRaZ2U3A6CBwHfoLz4OhLwCFjzPPGmMiaQP0my6JjrW0H/ggn58tZY8w/GGP+whjzHeBJ4CngtyIO0XUsN5LZXK8Lcs+x1APtzOC0a5LtofVZ818UkTn5S2Ar8FNr7RMR63WNy2L234FdwK9Zaweus+90r+XMSbaLzIeC4PQPcPrs3Y5T+7cdJ0C5A/huxP76TZZFyVr7JZzEqh6cvAN/DDwM1ADfGNOkXNex3Ehmc70uyD3HUg+0RW54xpiPA5/CyZj/gTgXR2RajDE349Ri/4219pV4l0dklkL3ST7gHdbal6y1vdbaU8C7cLLh3jnZ8Egii4Ux5g+B7+Ek9VsDpOJkza8E/j2YWV9EYmipB9rXexoRWt85/0URmbng0ANfBs4Cdwebf0XSNS6LTrDJ+DdxmmT92TQPm+61PNnTZ5H50BmcHo9MmANgre3HGdkEnGFDQb/JsggZY+4C/hfwI2vtf7PWVlpr+621x3AeGNUBnzLGhJrW6jqWG8lsrtcFuedY6oH2heB0sj7Y64LTyfpwi8SNMeb3cMb3O40TZDdOsNuk13gw2FmFUxNTOU/FFJlIGs41uQkYNMbY0AtnxAeAfwyu+1JweapruRin9qU2GNyILJTQddk5yfaO4DR5zP76TZbF5G3B6bNjNwR/U1/DiQl2BVfrOpYbyWyu1wW551jqgXboB+WgMSbqsxpj0oFbcTLRHV7ogolMxRjzR8D/AU7gBNnNk+z6THD6wATb7sDJqn/IWjsU80KKTG4I+OdJXseD+7wUXA41K5/qWn7zmH1EFsrPcfpmbx57HxG0NTi9GpzqN1kWo1C25fxJtofWh4av03UsN5LZXK8Lc88R7wHJ5/uF06zLAr87Zv0Xg+v/Lt5l1EuvyBdOU1sLvA7kXGffDKAFJ7DZG7E+CTgUPM8vxPsz6aVX6AX8j+B1+etj1q/CyezcBqyMWJ8NXA4ecyDe5ddr+b2AHwavv0+OWX8QCODUamcG1+k3Wa9F9wLeG7z2GoHSMdveHLyOB4Dc4Dpdx3otmhdwV/Ca+9Yk22d8vS7UPYcJnnTJMsaswfmSC3D+WJ4DbsYZY/sicIu1ti1+JRQZZYz5VZxEJX6cZuMT9Q2pstZ+I+KYB3ESnAwC3wbagXfgDF3wPeC9dqn/R5cbhjHmf+A0H/8Na+0/jdn2u8BXcP7wPYJTu/IQUIaTVO33F7a0ImCMKcO5j1iBU8N9HOcm7UFGb+D+K2L/B9FvsiwiwdYYTwBvAnqAH+AE3ZtwmpUb4PestV+OOOZBdB1LnASvvweDi0XA/ThNv18MrmuNvCeYzfW6EPccSz7QBjDGrAD+HKd5QC7QgPMj81lrbcdUx4ospIggZCrPW2vvGnPcrcCfAgdwnuBdBr4OfMVa6499SUVmZ6pAO7j97cDvA7txujedBf6vtfZfF7KcIpGCY2X/d5wbt2KgG+eG7y+sta9NsL9+k2VRMcZ4gY8BvwBsxmlO247TP/sr1tonJzhG17HExTTuh69Za1eOOWbG1+t833Msi0BbREREREREZKEs9WRoIiIiIiIiIgtKgbaIiIiIiIhIDCnQFhEREREREYkhBdoiIiIiIiIiMaRAW0RERERERCSGFGiLiIiIiIiIxJACbREREREREZEYUqAtIiIiIiIiEkMKtEVERERERERiSIG2iIiIiIiISAwp0BYRERERERGJIQXaIiIiIiIiIjGkQFtEREREREQkhhRoi4iIiIiIiMSQAm0RERERERGRGFKgLSIiIiIiIhJD/z/5vFCb3U1UiwAAAABJRU5ErkJggg==)



Computing the integral of the vector as a step function is very similar
to the `running_timeavg()` function. (Note: Computing integral in other
ways is part of NumPy and SciPy, if you ever need it. For example,
`np.trapz(y,x)` computes integral using the trapezoidal rule.)

<div class="input-prompt">In[54]:</div>

```python
def integrate_steps(t,x):
    dt = t[1:] - t[:-1]
    return np.cumsum(x[:-1] * dt)

# example plot:
for row in somevectors.itertuples():
    plt.plot(row.vectime[1:], integrate_steps(row.vectime, row.vecvalue))
plt.show()
```

<div class="output-prompt">Out[54]:</div>


![png](data:image/png;base64,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)



As the last example in this section, here is a function that computes
moving window average. It relies on the clever trick of subtracting
the cumulative sum of the original vector from its shifted version
to get the sum of values in every *N*-sized window.

<div class="input-prompt">In[55]:</div>

```python
def winavg(x, N):
    xpad = np.concatenate((np.zeros(N), x)) # pad with zeroes
    s = np.cumsum(xpad)
    ss = s[N:] - s[:-N]
    ss[N-1:] /= N
    ss[:N-1] /= np.arange(1, min(N-1,ss.size)+1)
    return ss

# example:
for row in somevectors.itertuples():
    plt.plot(row.vectime, winavg(row.vecvalue, 10))
plt.xlim(0,200)
plt.show()
```

<div class="output-prompt">Out[55]:</div>


![png](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA8cAAAGDCAYAAAAGWWIJAAAAOXRFWHRTb2Z0d2FyZQBNYXRwbG90bGliIHZlcnNpb24zLjMuMiwgaHR0cHM6Ly9tYXRwbG90bGliLm9yZy8vihELAAAACXBIWXMAABYlAAAWJQFJUiTwAAB5MklEQVR4nO3dd3wj13kv/N9BB0mwk7tcbu+7WmlXu+qSVWxHlmw1F8UlVmy/cUlxfe33JvaNEyU3TnLvTXFiX6cnvu69yZaruqy+qy2StleSu1z2AhAd5/1jwMEZEAABcIDBAL/v58MP0TEkgME853nOc4SUEkRERERERESNzGH1BhARERERERFZjcExERERERERNTwGx0RERERERNTwGBwTERERERFRw2NwTERERERERA2PwTERERERERE1PAbHRERERERE1PAYHBMREREREVHDY3BMREREREREDY/BMRERERERETU8BsdERERERETU8FxWb8BihBCnAbQCOGPxphAREREREZH51gKYkVKus3Ijaj44BtDq9/s7t23b1mn1hhAREREREZG5Dh8+jHA4bPVm2CI4PrNt27bOvXv3Wr0dREREREREZLI9e/Zg3759Z6zeDs45JiIiIiIioobH4JiIiIiIiIgaHoNjIiIiIiIiangMjomIiIiIiKjhMTgmIiIiIiKihsfgmIiIiIiIiBoeg2MiIiIiIiJqeAyOiYiIiIiIqOExOCYiIiIiIqKGx+CYiIiIiIiIGh6DYyIiIiIiImp4Lqs3gIiIiIiIqN5NDocQDsbR3OZBW0+T1ZtDOTA4JiIiIiIiqqBnf3QKLzx4Rj//qrduwmW3rLJugygnllUTERERERFV0JFnLhjOH3hoAFJKi7aG8mFwTEREREREVCFSSsxNxwyXzYxFMHlhzqItonwYHBMREREREVVIJBRHKrkwS3zm0JgFW0OFMDgmIiIiIiKqkOys8TwGx7WHwTEREREREVGFhKaj+unOFc2A0E4Pn5xGJBi3aKsoFwbHREREREREFaJmjrv6W7BsbSsAQErg7MvjVm0W5cDgmIiIiIiIqELUzHFTmwdrL+3Wz59laXVNYXBMRERERERUIWrmuLnVi7WXdennz748gWQyZcVmUQ4MjomIiIiIiCokpAbH7R509begpcMLAIiFExg+MW3VplEWBsdEREREREQVMjejllV7IYQwlFaza3XtYHBMRERERERUIYbMcZsHALDmUqW0+iU25aoVDI6JiIiIiIgqJDybCY79AS047t/SoV82PRKGTMmqbxctxOCYiIiIiIioApKJFOKRJABAOAS8TS4AgNvjhMfnBACkUhLRcMKybaQMBsdEREREREQVEAnF9dO+ZheEEJnz6SwyYMwuk3UYHBMREREREVVAJKgGx27DdU2BzPnwbBxkPQbHREREREREFRBWg+MWY3Dsa2HmuNYwOCYiIiIiIqqAojPHQWaOawGDYyIiIiIiogpQ5xz7szLHfs45rjkMjomIiIiIiCogUqCs2hAczzA4rgUMjomIiIiIiCrAWFbtMVznZ1l1zWFwTEREREREVAHhUCYj7GtxGa5jWXXtYXBMRERERERUAZFgQj+d3ZBLzRzPcSmnmmBKcCyEOCOEkHl+hs14DiIiIiIiIjuJhTPBsbfJGBx7fJlMcjyaAFnPtfhNijYN4LM5Lg+a+BxERERERES2EItkgl6P32m4zuXJnE/EUlXbJsrPzOB4Skp5v4mPR0REREREZFuG4NhnDL1cnkwRbyKWrNo2UX6cc0xERERERFQB8Ugm6F0YHBszx1LKqm0X5WZm5tgrhHgngNUAQgAOAnhcSlnUMIgQYm+eq7aatH1ERERERERVIaVETAmO3T5jWbXDIeB0OZBMaCXVyXjKEDBT9ZkZHC8H8OWsy04LId4jpXzMxOchIiIiIiKqaYl4CjKlZYOdLgecroVFuy5PJjhOxBgcW82s4Pi/ADwB4GUAswDWA/gggPcD+KkQ4lop5YFCDyCl3JPr8nRGebdJ20lERERERFRxaqfq7GZc81weJ6Jz2u3isSR8cOe8HVWHKcGxlPLPsi56CcDvCiGCAD4O4H4AbzTjuYiIiIiIiGpd3FBSnTvsYlOu2lLphlz/nP59Y4Wfh4iIiIiIqGYYO1XnzxzP43JO1qt0cDya/t1c4echIiIiIiKqGbECnarnuZk5rimVDo6vSf8+VeHnISIiIiIiqhmGOcd5MsdONzPHtWTJwbEQYpsQYkFmWAixFsDn02e/stTnISIiIiIisov5RlsA4G3K3WjLoURjXOfYemY05HorgI8LIR4HcBZat+oNAN4AwAfgQQB/Y8LzEBERERER2UJ0Lq6f9jblCbuE0E8yNLaeGcHxIwC2ALgcwPXQ5hdPAXgS2rrHX5YcBiEiIiIiogZiyBw3c4kmO1hycCylfAzAYyZsCxERERERUV2IhhbPHAv1DNOJlqt0Qy4iIiIiIqKGE1Eyx768ZdWZkyy2tR6DYyIiIiIiIpMZ5hznLasWeS4nKzA4JiIiIiIiMlkx3aqFGhszcWw5BsdEREREREQmixQx59hQVl3h7aHFMTgmIiIiIiIymZo59rFbtS0wOCYiIiIiIjKRlDKrrLqYbtXMHVuNwTEREREREZGJ4pEkZEoLdl1eJ5yu3GGXw5m5PBFPVWXbKD8Gx0RERERERCaKKJ2q8y7jBKC53aufDk5GK7pNtDgGx0RERERERCYqpqQaAAKdPv10cCJS0W2ixTE4JiIiIiIiMlHU0Kk6fzOuls5M5niWwbHlGBwTERERERGZqKzMMcuqLcfgmIiIiIiIyESGNY4LLOOkBsfMHFuPwTEREREREZGJDGscF8gcN7V64HBqCzpFgnHEo8mKbxvlx+CYiIiIiIjIRMay6vyZY+EQaOlQO1Yze2wlBsdEREREREQmUpdyKjTnGGBpdS0p/EoR1RkpJUbPzWJ2PPeOp6XTh941AQghqrxlRERERFQvoiGlrLrAnGNAO/6cF5xgUy4rMTimhvLyE+fx2NeOFrzNzb+1BZe8qr9KW0RERERE9SbKzLEtsayaGsrJfSOL3uaVX1+owpYQERERUb2KhTOZY4+/cHBsmHPM4NhSzBxTQ1HXj1u1vRNur1M7I4FTB0YBCYyenUE0nIB3kR0ZEREREVEuiXhKP+3yOAvelpnj2sGjf2oYUkrDDud179thCIC/9ZfPY/TcLKQEzh+bxLqdPVZsJhERERHZnCE4dhcu1m1hcFwzWFZNDSMSjCOZ3lF5fM4FmeGVWzr004NHJ6u6bURERERUPxKxzHrFpWSOg5NRyJSs2HZRYQyOqWGoI3HqCN28lVszwfEQg2MiIiIiKlPSUFZdOORye516R+tUUmJuNlbRbaP8GBxTw1Bb4wdyBMd9G9vhcGhLOI0PhTA3wx0TEREREZUuESu+rBoAWjozTblYWm0dBsfUMNQdTa7g2O11Ytn6Vv380DFmj4mIiIioNKmURDKRCY6dRQTHAa51XBMYHFPDmJ1Uy6q9OW/DecdEREREtBTJrGZcQohF72NoyjXOzLFVGBxTwwgukjkGjPOOB48wOCYiIiKi0iTixTfjmhfoUILjSQbHVmFwTA1jVilRydWQCwCWrW3T54XMjIYxMx6uyrYRERERUX2IziX004s145oX6FLLqhkcW4XBMTWMYjLHTrcDfZva9fPnj09VeKuIiIiIqJ4cfHhQP13MfGOADblqBYNjahixaKbExdvkynu7zr5m/XR4Jl7RbSIiIiKi+jI5HNJPe/35jzlVbMhVGxgcU+NQFlQXjvyNERzOzHVSchF2IiIiIire+FBQP33LfduKuk9TwKMfg0ZCccSVpA5VD4NjahhqnFuoaaAaOKeSDI6JiIiIqDih6SjCs1rlodvrRNeK5kXuoREOgZYOllZbjcExNQw1C1yopb7DwcwxEREREZVOzRp39TcXrFbMZiytZnBsBQbH1DDKyhynGBwTERERUXHGBzPzjbv6W0q6rxocM3NsDQbH1DBksXOOlU+FZFk1ERERERXJmDkuLThWlxoNTrIplxUYHFNDyC6PLlRWLVhWTURERERlGBtUguOVzBzbDYNjagjFllQD2WXVFdogIiIiIqoryUTKsIxT6ZnjTEMuzjm2BoNjagjFNuMCshpysayaiIiIiIowdXFOX+kk0OUreo3jecwcW6+0V4zIrpQM8GJdAw2ZY5ZVExEREVHagYcGcGr/aM6pd9G5hH661KwxALR0GOccp1LSkLShymNwTA0hmcxEx4uVVTNzTERERETZRs/N4slvHy/qtt0lzjcGtHWRfS1uRIJxpJISc9Mxw9rHVHkVK6sWQrxTCCHTP++t1PMQFSM0len45w94Ct6WmWMiIiIiynbh5HRRt3O6HNh81bKynsNQWj0eLusxqHwVyRwLIVYB+DyAIIDSh02ITDYznpm30drjK3DLrMwx1zkmIiIiIgBjg7P66ctevRIbLu/JebvOFS3wNbvLeo7Wbh9Gz2nPMzMeQd/Gsh6GymR6cCy0bkf/BWAcwPcAfMLs5yAq1cxoZuSttctf8LaC6xwTERERUZaxgcwyTet29mDFpg7Tn0M9Tp0ZY+a42ipRVv1hAK8G8B4AoUVuS1QVhsxxd+HMMcuqiYiIiEiVTKYwcT4T2pQzp7gY6nEqg+PqMzVzLITYBuCvAfyDlPJxIcSrS7jv3jxXbTVl46ihzSo7l9buwpljNuQiIiIiItXU8BySCa3Ba0unt+yy6cUEutXMMZdzqjbTMsdCCBeALwM4B+BTZj0ukRmmSwiODZnjVIEbEhEREVFDGBvMlFR3rwxU7Hlau5TMMRtyVZ2ZmeM/AXA5gBuklCW/klLKPbkuT2eUdy9x26jBzRrKqkvIHLOsmoiIiKjhjQ1kmnF1r6pcv+GAEhyHJqNIJlNwOiu2wBBlMeU/LYS4Glq2+G+llE+b8ZhEZomE4vqi7C6PA/5A4TIYQ+aYZdVEREREDU/NHPdUMHPscjvR3KYtOyolEJxgaXU1LTk4TpdTfwnAMQCfXvIWEZlMzRoHuvzQGqrnJ5g5JiIiIqI0KaWhU3UlM8cA0NrDecdWMSNz3AJgM4BtACJCCDn/A+BP07f5t/RlnzXh+YhKMq0s49S2SKdqgA25iIiIiCgjNBVFJBQHAHh8TkPpcyVwOSfrmDHnOArgP/JctxvaPOQnARwFwJJrqjq1mUFgkfnGAOBwZoLj+a6ERERERNSYJi/O6ae7+lsWrUJcKjX4Dk5GK/pcZLTk4DjdfOu9ua4TQtwPLTj+v1LKf1/qcxGVY1YpR2krIjj2Bzz66bmZWEW2iYiIiIjsIRnLJEs8flNXws3J5ckU9zJRU11sfUZ1Ty1HKaYMpqXdq58OTXG0joiIiKiRpVKZaXZqhWGlOJTu1GwOW10MjqnuzSgNudp6Fs8ce5tdcLq0j0YskkQskqjYthERERFRbVMDVLU3TaWoAXiKmeOqqmhwLKW8X0opWFJNVpEpaZxzXETmWAiB5naltHqapdVEREREjSqVzASo1cgcO9X+NylmjquJmWOqa6HpKFIJbafia3HD4ytunkhzW6a0OsjSaiIiIqKGZcgcOysfPrGs2joMjqmuqfONW4toxjWvmfOOiYiIiAjGOceiGnOOXUpZdZJl1dXE4JjqmrpwemsRaxzPUzPHDI6JiIiIGpcxc1zlOcfMHFcVg2Oqa9NmZI6nGRwTERERNSo1e+usRkMuB8uqrcLgmOqausZxaxHNuOapDbmYOSYiIiJqXGqAWpWyanartgyDY6praqfq8uccs1s1ERERUaOqdkOu+SVFs5+bKo/BMdW1kLIMU0uHt8AtjQxzjllWTURERNSwkkr21lnlzHGSwXFVMTimupaMZ3ZmLo+z6PtlzzmWkjsmIiIiokaUiCX10y5v8ceT5TI25GJZdTUxOKa6ZhjpcxX/dnd7nfD4tTWRUwmJSChu+rYRERERUe2LRzPHk+4Ski3l4jrH1mFwTHXNEBy7S3u7c61jIiIiIoormWO3r9qZYwbH1cTgmOqaWlbtdJU2R6S5Te1YzaZcRERERI0oHlGC4ypkjtVjVpZVVxeDY6pbMiUNo22llFUDzBwTERERkQVzjrnOsWUYHFPdSiojbQ6XgBAlZo7b2bGaiIiIqNHFo2rmuPLhE7tVW4fBMdWtZKL8rDFgXM4pyMwxERERUUNSM8dur6viz8du1dZhcEx1yzjfuPS3eouSOZ5jcExERETUkNTMsctb+fBJPW5NJZg5riYGx1S3yl3GaV5Tu9KQa5oNuYiIiIgakbGsmt2q6xmDY6pbg0cm9NOlLuMEGDPHLKsmIiIiakzWLuXEsupqYnBMdWtmPKKfDk2WHtw2tXogHNrOKTwTM8w3ISIiIqL6J6VEPJw5BvRUYc7x/PEnAKRSzBxXE4NjqltqCcyOm/pLvr/D6UCgM5M9nh4Lm7JdRERERGQPsUhSD1BdXmdZ1YilUoNjMDauKgbHVLfU4Lh9WVNZj9HW49dPz4xFCtySiIiIiOpNJBjXT/uaK581BgB18VHJ4LiqGBxT3YpH1Lb75c0Pae3JBNUzo8wcExERETWSSEgNjt1VeU4hMuGxZOq4qhgcU90ydBYsMzhu685kjqcZHBMRERE1FCuCY0OExn5cVcXgmOpWPJrQT5fbWbC1x6efZnBMRERE1FgMZdUtVcocK6eZN64uBsdUt9Sy6nI7CxrnHDM4JiIiImoklpdVc9JxVTE4prplRll1a7cxOGY7fSIiIqLGYUlZNVPHlmFwTHUrFln6gu0enwv+gLYjTCUlgpPsWE1ERETUKKJBazPHALPH1cTgmOqWGZljIKu0mvOOiYiIiBqGIXNcpTnHAKDGx7/64it45CtHMHxqumrP36gYHFNdkilpWnDcyrWOiYiIiBqSJWXVMGaPjz17Ea88eR4//vwBxCKJAveipWJwTHVpZjwMmZ4f7A+44XSV/1ZvCnj009E57pCIiIiIGkUilllLqdxpeuVYua1jwWXRuQTOvjRetW1oROW18CWqceODIf10V3/Lkh7L5cnsCBPxZIFbEhEREVE9SSYywbHTWb284u2/eynOvTyBWCSBgcMTOPbsRQDAyb0j2HTFsqptR6NhcEx1aWwoqJ/uWrnU4DizI0zEGBwTERERNQpDcOwWBW5pLpfbifW7egAAy9a26sHxmZfGEYsk4PExjKsEllVTXRpXguNuEzPHcaW0hoiIiIjqWzKR6RS9lGl6S9GxvBld/c3a9sRTOHuIpdWVwuCY6tL4oJI5XmJw7FbLqpk5JiIiImoYaubYUcWy6mwb9/Tqp0/sG7FsO+odg2OqO/FoEtNj2pJLwiHQ0de0pMczlFVHGRwTERERNYqUWlZtUeYYADbszgTHZ9Ol1WQ+BsdUdybOh4B0BUx7rx8u99I6C7KsmoiIiKgxGcuqqzfnOJtWWq1VQybjKZw5NGbZttQzBsdUd8ZNbMYFsCEXERERUaNKJmsjcwwYS6tP7h21cEvqF4NjqjuGTtVLnG8MZC3lxMwxERERUcNI1khZNWAMjllaXRkMjqluJJMpPPzlwzj0yKB+2VI7VQNZDbm4zjERERFRQ5BSIqWUVTuc1pVVA0D7sia9KjKZSOHfPvo4hk9PW7pN9YbBMdWNUy+O4vCvLxgu60y3vV8KY1k1M8dEREREjSA7MBYOa4NjANioNOYCgOd+dMqiLalPpgTHQoj/KYR4SAgxIIQICyEmhBAvCiH+VAjRZcZzEC1m4kLIcH7D7h60dvmX/LguLuVERERE1HDUsmW3b2kNXs2y/YYVhvPByahFW1KfzMocfwxAM4BfAvgHAF8FkABwP4CDQohVJj0PUV7B8Yh+es/ta3Db+y815XHVzHGcwTERERFRQ4iGM8Gx1++ycEsymlo9+K0/v0Y/H+cyo6Yy61VulVJGsi8UQnwGwKcAfBLA75v0XEQ5zU5k3oIrNrab9rhsyEVERETUeGJKcOypkeAYMAbqTNyYy5TMca7AOO1b6d+bzHgeokLU4DjQ5TPtcV1KZ8JkPAWZkgVuTURERET1wJA5bqqd4NiQuIkycWOmSr/Kd6Z/H1zshkKIvXmu2mre5lC9SqUkghOZORctneYFx8Ih4HI7kIhrO59EPAW3tzbmnRARERFRZcTmlMyxr4aCY7eSuEmkkEpJOGqgWVg9MPVVFkJ8AkALgDYAVwC4AVpg/NdmPg9RtrnpKFLpjK4/4DYsv2QGl8eZCY5jSQbHRERERHWuFuccA+nEjcehT/dLxJI1Fbzbmdn/xU8AWKac/xmAd0spRxe7o5RyT67L0xnl3eZsHtWrWaUZV8DErPE8l8cBpJthx2NJLL0HNhERERHVMsOc4xoqqwYAt9epB8fxKINjs5i6zrGUcrmUUgBYDuBNANYDeFEIweCWKmqm4sExm3IRERERNZJojTbkArjUaKWYGhzPk1JelFJ+H8CtALoAfKkSz0M0T23G1WJiM6556nJO3AERERER1T91znEtlVUDMEzxC03HEAnFDZluKk9FX2Up5VkhxCsAdgkhuqWUY5V8Pmpchk7VFcgcu5k5JiIiImootbqUE2DMHH//b/bpp9ft7Mbtv3sphGCDrnJUJHOcZUX6N9NtVDFzU5lO1YEOZo6JiIiIaGlqtSEXADS3eXJefvrAGEbPzVZ5a+rHkoNjIcRmIURbjssdQojPAOgF8JSUcnKpz0WUTzyaCVjdfvM7SXPOMREREVFjqeWGXLtftwZd/S3wNrngbXLB4cxkiqdHwxZumb2Z8Sq/HsBfCSGeBHAawDi0jtU3QWvINQzgfSY8D1FehuDY5GWcAGNwHGfmmIiIiKju1XLmePn6Nrzt01fp55/8znEc+NUAAGBmjMFxucx4lX8FYCO0NY0vB9AObdGbYwC+DOAfpZQTJjwPUV5xJZtbiTWIWVZNRERE1Fhqec5xttauzEKjM8wcl23Jr7KU8iUAHzRhW4jKllAyx64KZ45ZVk1ERERU/2o5c5yttTvTc2d6LFLgllRINRpyEVWcWupcicyxW80cx5k5JiIiIqpnUkrEwpljvlrPHLf1ZDLHs+PMHJeLwTHVBWPm2Py3NTPHRERERI0jHk1CpiQAwOV2wOmq7bAp0JXJHM9ORJFM8ni1HLX9KhMVQaYkEnFlznElyqrdbMhFRERE1CjsNN8Y0I5Vm9u9ALRj4+BEdJF7UC4Mjsn21GDV5XZAOMxf9NzYkIsjcURERET1zDDfuMaWccpHnXfMjtXlYXBMtqcGq64KzDcGjGXVF09PV+Q5iIiIiKg2xObslTkGgNZupWM1g+OyMDgm2zu1f1Q/XYmSasCYOR4bCGL/r85V5HmIiIiIyHp26lQ9zxgcs2N1ORgck+0NHZ3UT1cqc9ze22Q4f3LfaJ5bEhEREZHdRW2YOW7p8Oqn56Y557gcDI7J9kYHZvXTl//G6oo8R8/qAHbc1K+fj87FK/I8RERERGQ99VjP1+y2cEuKZ+iRk2CPnHIwOCZbi87FMT2izalwOAQ2Xdlbsee64va1+umIMppIRERERPUlElSC4xabBMduLj26VAyOydZGz2Wyxp39zYadgtnUToXRUBxSyoo9FxERERFZR02E2KVbtcudCe2ScS49Wg4Gx2RrI2czwXHvmtaKPpfL44QzvdNJJSVH5IiIiIjqlB0zx04lOE7EeZxaDgbHZGvG4DhQ8eczZI8575iIiIioLtlyzrFSQZlkcFwWBsdka6PnZvTTlc4cA8adYyTEecdERERE9ciQObZJcMzM8dIxOCbbigTj+hpuDpdA54rmij8nM8dERERE9U+dc2yX4NjF4HjJGByTbY0oWePu/hY4XZV/O3ubMjvHKDtWExEREdWlaMh+mWN1KadkjA25ymGP1mtEOVSzGdc8n5I5joSYOSYiovoVCcZx9LlhREJxOBwC63Z2o3tl5ft7EFktlZKZJIgAPDbpVs2y6qWzxytNlIO6jFNPFZpxAcwcExFR43jkK0dwav+ofn7/rwZw319ca5ssGlG51KlzXr8LDoewcGuKx4ZcS8eyarKt4GRUP92xvPLzjQHA28w5x0RE1BiGjk0azsfCCYycmclza6L6oS7X6fY6C9yytmRnjqWUFm6NPTE4JtuKhZXF2f3VKYIwZI7ZrZqIiOpULJLIWSE1OTxnwdYQVVcqmQkqHU57ZI0BwOEQhu1NJpg9LhWDY7KtqBIce6oWHDNzTERE9U+tzlJNDoeqvCVE1SdTmeBY2KSkep6hY3WMwXGpGByTbRkyx1VqlGBY55hzjomIqE4FJyM5L2fmmBqBIXNss+DY6VHmHTNzXDIGx2RLyXhKbzQgHMLQur6SDJljdqsmIqI6FZzIZI77Nrbpp5k5pkaQStmzrBoAXC5mjpeCwTHZkrGk2gkhqrPjMpZVM3NMRET1aVbJHPdtaNcb/YRn41zKkOqercuqPWpTLq51XCoGx2RLVjTjArLLqnlwQERE9Umdcxzo8qF9WZN+nqXVVO9sXVatzDnmck6lY3BMthSLVL8ZF2BcBD42lzCMLBIREdWL4EQmc9zS4UXHcjU4Zmk11Tdbl1VnLedEpWFwTLakljRXM3PsdDr09e6kBGJRlqsQEVH9MWSOO33oUDLHU8wcU52TqUxQabeyaqdbacjFOcclY3BMthSzYBmned5mNuUiIqL6FZyMYOpiJgBu6fSho69ZP8/MMdU7u65zDGTNOWa36pIxOCZbilo05xgAvE2ZecdsykVERPXmqe+d1E+7fU54/S5DWfXEBQbHVN/sPOdYLaueGQ1buCX2xOCYbEltMKCu51YN6k6H68cREVG9GR8K6qe7VrQAADqWNeuNfmbGIghNR3Pel6gehKZj+mlfi8fCLSnd8vWZpdf2/eIs4pwCWBIGx2RLVpa7qM+XSjI4JiKi+iFTEtMjmWzTHR+8DIDWAXfZ2lb98gsnpqu+bUTVElSWMgt0ei3cktJdcmM/mtq0gH5uOoYDDw9YvEX2wuCYbCmpBKVWBsfJJLtVExFR/ZidjOhVUf5Wj2EqUd+GTEbqwsmpam8aUdXMjqvBsc/CLSmd2+PEVXes08+/+POzCAdjBe5BKgbHZEtq5thZ9eA487GRDI6JiKiOTF/MZI3be/2G6/o2tuunmTmmejarLmVms+AYALZd16evTR6LJLH3p2ct3iL7YHBMtmQsq67u21htzJBicExERHVkaiTTpbpdWb4JAJZvaAPSX4FjA7OIRdiUkupT9lJmduNwOnDtPRv084ceG8TMGJtzFYPBMdlSqkbKqtVF4omIiOxuUlnCqb3XGBx7/S509WsNuqQELp6aqeq2EVWDlNKQObZjcAwA63Z1Y9k6rU9AKiHx7AOnLN4ie2BwTLaUStRKQy4Gx0REVD+mL+bPHAPACmXe8fkTU9XYJKKqCs/G9VVRPH4XPFVeMtQsQghc96aN+vljz13E6MCshVtkDwyOyZYMc45dVpZVs1s1ERHVD0NZde/C4LhvU7t+mk25qB7VQ9Z43opN7Vh7Wbd2RgLP/OBk4TsQg2OyJ2vLqjMfG5ZVExFRvUjGU5iZ79IrgLYe/4LbqB2rL56a0TtbE9WL4IR9l3HK5Zq710OkD5XPvTyBwSMT1m5QjbNnnQA1vKSFDbmEEow/+tWjeOKbxxfcJtDlw2vetQ09qwLV3DRqAC8/MYTnf3IGQgBX37UeW6/ts3qTiKhOTI+GgfTXa2uXD073wu/Xlg4fAl0+zI5HkIincPalcazf1VPlLSWqnHrKHANAV38LtlzbhyNPXQAAPP39k3jLH3VAiOoml+xiyVGFEKJLCPFeIcT3hRAnhBBhIcS0EOJJIcTvCCGYnSbTpRLWZY49Pqd+OhlPIRZOLPgZHwzixV+cq+p2Uf1LJVN48tvHEZqKIjgZxZPfPg4pWb1AROZYrKR63gplSaef/sshPPHNY+xcTXXD7ss45XLVHev0aYgjZ2e1gTDKyYzA9V4A/wbgagDPAvgsgO8C2AHg3wF8S3BogkwWDWe+hL1VbpSw7bo+tHQsXmbDlvlktunRMBKxzMBQdC6B0FTMwi0ionoypTTjasvRjGve7tvWwO1NDxRL4OAjg/jGnz+Hcy+PV3oTiSouOKEs49RVH8FxoNOH7lUt+vnwbNzCraltZkQVxwDcBeAnUkr9qE0I8SkAzwF4M4A3QQuYiUwRU4JjT1N1g+PulQHc95nrEM8xSj4zHsG3PvM8ACA0HV1wPdFSTF6YW3DZ1MhcUYM1RESLKTZz3NnXjLd9+io8+rWjGHhFm784OxHBA587gC1XL8f1926Ev8VT8e0lqoR6K6ue51WOl6NzDI7zWXLmWEr5sJTyATUwTl8+DOCf02dvXurzEKkic9ZljgGtY7W3yb3gR132Ym46BsmGXWSiiQuhBZepmR4ioqWYMizjtLAZl6q12487P7QTr333NnibM9/DR58dxtf/7Fkce36Y0z7Ilgxl1R11FBz71eCY0yDyqfR84PlhCb4CZKqYGhw3uS3cEiO3x6mvh5dKSkRCHJkj80wOMzgmosqZGslMByqUOZ4nhMCWa/rwjj+9Bpuu6NUvD8/G8cv/eAUPfuGgIdAgqnXxaBKRoHbs5nAKNLfVTwWEerzMzHF+FUu5CSFcAH47ffZnRdx+b56rtpq2UVQ3DHOOq1xWvZjmNo9e9h2ajsEfqJ8dK1mLmWMiqpRoOIHwjNbDwOlylNSIqKnVg1vfuwObrxrDY18/iuCkNq3ozKFxDB1/FtfeswE7buyHcLAFDdW24KSaNfbW1XvWWFbNvGU+lcwc/zW0plwPSil/XsHnoQaTSknjnGMLyqoLaW7PzP/kvGMySyolMTm8MBCeZHBMRCaYVuYbt/X64SgjKFh7WTfe/idXY8eN/fpl8UgSj3/jGL7/t/tyVr8Q1ZJ6nW8MZGeOGRznU5HgWAjxYQAfB3AEwH3F3EdKuSfXT/oxiHSGwNjnLOsLvJKalBKc0BSDYzLH7HgEybjW2sGtLCc2OxZGMpHKdzcioqIY5hsXUVKdj8fvwk3v2II3fmK3oQ/HhZPT+MZfPIcXHjzNfRbVrNnx+lvGaZ7aG4Bl1fmZHhwLIT4I4B8AvALgFinlhNnPQY3Nyk7VxWhuy2SO56a5zA6ZY1Ipqe5dHUBLp/Y+kxJcr5CIlqyUZlzFWLGxHW/94yux5/Y1+iB2KiHx7I9O49t/9TwunplZ8nMQmW1+SgBQj5ljllUXw9TgWAjxUQCfA/AStMB42MzHJwKMH2ivv3aacc1Tg+PZSTYiIXNcODmtn+7oa0aHkpHhvGMiWiq1GVfbEjLHKpfbiWvu3oB7P3UletcE9MvHh0L47v98AU9+5zji0aQpz0VkBjVzXHfBMbtVF8W04FgI8YcA/h7AfmiB8YhZj02kUktBaq0ZF2Ccc/zKE+f1rodE5Tr2/DD2/fysfr6zr9lQ9sjgmIiWypg5Nic4nte9sgVv/m97cP1bNsLl1g49pQQO/GoA3/3fe5FKssyaaoNhGadOb4Fb2g+7VRfHlOBYCPFpaA249gJ4jZRyzIzHJcqlljtVAwsPKo4+xwIKWppXnjhvON+zOoCOvmb9/MBhzl4hoqVRp2e09Sy9rDqbw+nArteuxtv+5Gqs3NqhXz4+GMT4EBt1UW1QG6m2tNdX5ljtiTNxPpRzBQwyITgWQrwLwJ8DSAJ4AsCHhRD3Z/28e6nPQzTPWFZde8Fx98oWtHRkRhsHGbjQEs3NZkZ411zahWXrWrH2sm4g3Ytu8Ogk1xIlorJF5+J6Pw+X24Gm1sotQdjW48ddH9mF/i2ZAHlmnH0TqDaofW18LbU3dW8pmtu8WL29E4BWufHcA6ct3qLaZEbmeF36txPARwH8aY6fd5vwPEQAsoLjptrccd39scv100PHppBkyRgtQSSYaex2y29thRACgU4fVs4fXErg6LOsUCCi8syo8yy7fBCisqtACCHQuTxTZaXO8ySyipTScIzp8TsL3Nqerr57vX765L4RjJ6btXBratOSg2Mp5f1SSrHIz80mbCsRgNrvVg1oI+OBLq0cJx5N4uIpduWk8kgpEQkpI9nNmQGhrdf26aePPH0BUsqqbhsR1QdDE6Iu80uqc1GfZ4bBMdWARDyFVFL7HnW6HXC56y847l3TivWX9+jnn/3RKQu3pjZVZJ1jokqKhpSGXDVYVg1oo+KrtnXq5zknlMoVCycgU9qXtdvnhNOd2W2vv7xHX/N4eiSMYQ7CEFEZ1OC4tas68ywDyvMwc0y1IFbj0/bMctWd6/RpWWdfGseFE1OWbk+tYXBMtlPrDbnmqQ1HGBxTucJKt3M1awwAbo8Tm/b06uePPHOhattFRPVDnfMbsCQ45pxjsp5x2l7tHl8uVdeKFmy5arl+/pkfnmLlmYLBMdmOXYLjVVs79ZG5kTMzhu0mKpa6FJg/R3MQtbT6xPMXkYhxzVAiKs1s1pzjalAz1DPjER6ck+XU4zRPHWeOAeDKO9bB4dAOUs8fn2ISR8HgmGwnZpORPV+LGz2rAgC0roBDRyct3iKyIzU4ztU5c/mGNn3ZlVgkiVMHRqu2bURUH2YMZdXVmXPsa3HD5dEOQ+ORpCFrR2QFde3fei6rBrTeONtuWKGff5bZYx2DY7KdiKGTYG12q57Hece0VJFQ4eBYCIGt12bKo448za7VRFQaKzLHQghDUy7OOyar2aHhq5muuH2t3sdk5OwsTu8fs3iLagODY7KdmDqyV+M7r1XbMvOOzxwaw+GnLuDwUxdw9qVxpLi8ExVBnXPsb8699uiWa/oyax4fnkBwMlqNTSOiOpC9xrE/UL1B51Y25aIaEm2QhlzzWjq8uPSmfv38T//lEAaOTOhNQBsVg2OyHbvMOQaAvg3tcKVH5YITUTz8pcN4+EuH8ePPH8Cvv3PC4q0jO1isrBqAYc1jKYFjzzF7TETFmZ2o7hrHKjVL/eS3j2PfL84a9nlE1WSn40uz7L5tDdzezJJVP/rsfhx4eMDCLbIeg2OylXg0iURMy7g6nMLwga5FTrcDa3Z05bzu7MvjVd4asqPp0Tn9dHN77swxAGy6Ypl+euQsl3QiouKEZzPBaFObt6rP3b2yRT89OxHB0987iS9+8td46P++wv0YVV08kgmO3b7GCI79LR7seu0qw2WnDzR2eXVjvPJUN0LTmXLR5jZvVUe4y/Wqt21Ga48f4ZkYUimJY89dBADMTccs3jKyg7GBoH66e2Ug7+06+pr109OjXBaFiIqjdriv9oDz1mv7EJyM4tBjg4iGtMAkGU/hyNPDOPL0MJata8WlN/Vjw55euNy1PRhO9hePZaa7uT2N83674vVrMTsZxZGntOUgZ8Ya+xiCwTHZypwaHBfIotWS5jYvrnvTRgCAlBIn940imUghHk0iFknA0yCjk1S6WCShB7oOh0BHX1Pe2853rAa04FhKaYvBIyKyVkIJCOanAVWL0+XA1Xetx57b1uD4CyM49OggRs/N6tdfPD2Di6dn8OR3TmD7DSuw48Z+BDqr0zCMGk8imhkomu+k3ggcTgdufscWHH36AqQEglNRJOMpvVlXo+FROdlKaCqTbW2ucvmXGYQQaGr16HO8wrMxBseU1/hgJmvc0ddUMHPiD7jh9joRjyYRjyQRCcbhD9hjAImIrBOPWR8QuDxObLuuD1uvXY6LZ2bw0qNDOL73IlIJrTFQJBjHvp+dxYs/P4u1l3Xj0ptXYuXWDg4AkqmsrKKwmtPlQEuHTzs+lcDMeBgdy5sXv2Md4lE52YpaVt3Ubr/gGACa2jLBcWg6hrae/NlAamxjg8WVVAPawEtrj18PqKdHwwyOiWhRybiSOba4lFQIgeXr2rB8XRuue/NGHH7qPF56fAjBCe27X0ptPuTpA2NoX9aES2/ux5Zr+hqiszBVnlpWbfVnwQqtPT79+HR6tHGD48bMl5NthabUOcf2PPBvas1sN+cdUyFjA5nywu5VLQVuqckurSYiWowhc1xDZZRNrR7suW0t7vsf1+L2370UK7d2GK6fujiHJ755HF/8o1/j0a8dxfhQMM8jERXHkDluwOC4rTtzDDEz1rhLq3GojWwlpASTzbbNHGe2e26G69FSfsbMcRHBseGLjcExES0uUePZMofTgfW7erB+Vw8mh0M49NgQjj59AbGIFsgkokm8/PgQXn58CCs2tePSm1di3a5uOJ21E+iTPcTVOccNVlYNAK3KAPtMAw+wMzgmWzFmju0ZHKsZb2aOKZ9UMoXxoZB+frGyasD4xcbMMREVI1EDc46L1bG8GTe+dTOuuXs9jj13EYceHcTE+cx+8vzxKZw/PoXmNg8uubEf229YYdtjBao+40BRbX8WKqFVGWCfbuABdgbHZCvZSznZkaGseobBMeU2eXEOyYT2Rd3S4YWvxb3ofdo46ktEJUqoc45tslySx+fCjhv7ccmrVuD88SkcenQIp/aPQqa0Bl6h6Riee+A0XvjJGazf3YNLb16Jvg1tbOBFBcUbvay6h9VnAIPjmnXh5DROvTiC9bt60Lex3erNqRlqWXVTHcw5Hjw6iUe/dlQ/73QKbLpyGZavb7Ni06iGnD00rp/uXrV41hgwfrFNMTgmoiLYKXOcTQiB/s0d6N/cgeBkFC8/OYRXnjivDzynUhInXhjBiRdG0NXfgqvuXIf1u3os3mqyQjKRwuFfn8eYUpHVFHDjkhv79WSL8bPQeMGxmjmeaeAlIRkc16BYOIEHPrcf8UgSLz95Hu/+q+vhYSdGxCIJfQ06p9sBb5M9/yfqnOPZ8QhefnzIcP2RZ4bxrr+6jks8NbhDjw7qp4uZbwwALZ0+OJwCqaREeCaGeDTZcMtREFFpjGu72nd/0dLhxdV3rscVt6/FqRdHceixQVw4Ma1fPz4UxE//5RDu+4tr0drlL/BIVI+OPjuMx75+bMHlExdCuO39lwIwfhbcXnsNFJnB1+yGt8mF6FwCiXgKczMx21ZpLkXjvfI2MD0aRjzdaCIeSXLuYNr8/wQAvH6XbUezuvqbC2a9Y+EEX3PSywMBoHdNcZljh0MYBo1ikYTp20VE9SU4qSyRWAfLvzldDmy6chne9Ik9eOsfX4ntN6zIdOGWwOi52cIPQHVpLM/rfvH0DABtSbP5Jm/CIeBu0ASFWt0YDTXmMURjvvI1LvuANjoXt2hLasv8/EtA+/KzK5fbid/85JU4+9I4UsnM33Tg4UFMXZwDAERDfM0bXUwZwV6xqb3o+zmUDq2ppCxwSyIiYGpkTj/dtqy+MqrdKwO45Z1b4XI7cPARrRpneoSDz40oqhxbb7lmOY4+MwxAm66XSqYQUlYPaWr1wOGwZwJmqdRqM7V7dyNhcFyD1AwpAETnGnPkJpshOK6htRjL0dzuxfYbVhguO/fKRCY45mve0KSUhi+lUkqjHc7MF7qafSYiyhadiyM8qw3GOl0OBDp8Fm9RZbT1spN/o4uFM9+p63f14NzL4wjPxiFTEnMzccPqIc027WljBnVqhdqgrJHYO8KoUwsyx2EGSgCQTGQO9NUAoF74mjPdiCPMHDe0RCwFpN/uLrfDkA1ejDrazcwxERUypWRR23r9EHWaLWvrbdJPTyuZcmocMeVY2uNzork9M5c2OBUxLBXa1IDzbOepg/GJBs0cMziuQbHszHGD1vxnU0uQ7VxWnY9XCY6ZOW5s6gCZ21dagxx14CipfGaIiLKpgWK7EkDWmzauAd/w1O9Vj9+FFqVKIjQZNS4V2t64wbEhc8zgmGrFwswxs4iAMXPsdNXf6LbaSInzzBubOrWi1KYgapaZZdVEVMj8VB7AWHpcbwJdPj0rHpyMGpbsocagJp48Phda1MzxZNSwVGgjl1WrA/Isq6aawTnHudVLQ658jGXVfM0bmTpa61lC5phl1URUiFpW3b6sfjPHTqcDga5MppDZ48ZjKKv2u9DcoZZVRzE3xcwxALiZOWZwXIti4exu1QyUACClBMeOOgyODZljzjluaIay6hLXKWZwTETFMpZV12/mGDD+fQyOG4+hrNrnRIsSHIcmI4ayanU5o0ajru/M4JhqxsKlnBgcAw2QOW5SMsd8zRuaoazaW2pZtRocc84xEeUmpcxqyFW/mWMAaOtRm3IxOG4kyXgKqfTUPIdTwOl2GMuqp7LKqhs5c8yGXFzKySqplMRT3z2B88ensGpbJ665Zz2EEEgmUzjy9LDhtjHOOQaQNee4DrtVe5szH8eLp6bxzc88V/D2q7d34pp7NkCI+vtfNLpY1DjCXQq1W/X3//ZF3PXRXVi1tdO0bctn9Nwsnv7BSbi9TrjcDkxcCMHhENh05TLseu3qij8/USM498o49v70LOLRJDbu6cXu160p+7HCs3G9Us3tddZ9tkxtyjU1yo7VjSRq6FTtghDC0JBr5MysoUdHcwN3qy60lNOFk9N47oFTi66oIoTAmku7cNUd62x5jMrg2CLnXh7HgYcGAGgHlWt2dGLFpg6c3Duy4LbMHGuSdV5W7WvJZI4T8RTGBoIFbz82EMSqbZ1YWYXAh6rL2JCrtODY6Tbe/olvHMM77r/GlO0q5IlvHsOFk9MLLh85O4v1u3rQ2l3fJZtE1fDY145iZiwCQDt2WLW9Ez2rAmU9llpa3Nbrt+VBbCnUhmODhyeQjKfgdNffsQQtpDY59fi170h1zrHh+NIp4FeOxxqNmjmOZcUfT3zzGEbPzRb1OKPnZrHusm70rmk1dfuqgXsFi6jrqQHQyzlGcrzpGBxr1O6SLk/9vXUDnT6s2tZR0n0mhzn6XY8MXTVLLKvecs0yw/nsfU0lyJTMGRjPC1ZhG4jqXSKe1APjeQOvTJT9eMHJzGO1dtX/4FXfxna9t8fMWAT7Hzpn8RZRtaifm0CnljF2e5zYcvXyBbfdfsOKul3vuxjqvmBS6WafTKYwPlg4aZMtOGHP735mji2ilggD2twfAJjKEexEwwyOAWNjgFKbFNmBEAJ3fngXJi/MGUYxs73y5Hm89PgQAAYd9Sq+hHWON1+5HMvXteHLf/w0ACBZhaZcsxORgtcn45z7TLRUc8qcyHlDxybLLq1WB84aYekar9+Fq+5cjye+eQwA8MKDZ7D5quV6sET1a2pEXbIsM/f8te/Zjitev1Y/vvT4nYa56Y2os79ZPz1+PgSZkhAOgdmxCFLp0vOmVg/u+ODOnPd/+gcn9UG7QseytYzBsUWyG+XI9NnJ4dCC2ybjKSTiSbjc9RcQlkLNHKut5uuJEAKdK5oL3qZ7VYt+uhpZQaq+WLT8smrAWC5WjY7VE+cX7rdUdv2CJKolczMLg+PzJ6aRTKbgdJZeTWUIjjsaY47ljhtX4JUnhzA+FEIilsJT3z2B171vh9WbRRU2fVHtym4Mfut5CbNyNLV64GtxIxKMIxFNYmY8grYevyGL3LmiGT2rc0/naApkBtrs+t1ff7WpNrHggFVKrWRqPJ2BEcaDYpZWA/Fo5kPmqsPMcbHULooMjuuTOufY4yt9DFNtyiVT0tBopBImLjA4Jqo0damZeYloEiNnipsDuODxGnBdV4fTgRvftlk/f2LvCAaPlF+aTvYwlTW/nvITQqBLzR4PaaXUavKu0ICCOo8/YdOqMQbHFlmQOZbppQXSx7CtXT5DtzwGx8auefWaOS6GYW0+Bsd1Kb6EdY4B7cutmusdL5o5tukXJFEtyVVWDQBDR8sL7hp16ZoVmzqw6cpMb4YnvnUcSS57V9em1MwxM8WL6urPVChOnNeC42L/h+pSq3YdGGdwbJFcc47V5krty5rh8WcyRjHOOzast1aPc46Lxcxx/VPLqktdymmeGhxX+sCPmWOiylMzx63dmXmyg0enynq8oGHOceMExwBw/Zs36scRE+dDeOnRIYu3iColGU/pfTGEANq4csKi1OB4fEj7fleD447lhYJj5djDpt/9DI4tkp3JkRKYupg5wOxY3qR3VQSYOQaMmWOXt3Hfur5mtz4yF4skEYvwvVFvjEs5ldcaQh29rWTmWKYkJhcLjpk5Jloydc7x5qsyXXaHT04jEU/mukteUkrD4GpLA2WOAW2Q+Yo3rNXPP/fAqZxl62R/06OZqsxAl4/LdxWha4UaHM+XVZeeOU4xOKZSZGdyZMqYOV4YHBdecLsRGDLHDVxWLYRAc3um4QGzx/VHHfAwI3NcyeB4Zjy86Lyi7EoZIiqdWlbdszqgH6AmEylcPDVT0mNF5xL6oJXb6zRUqjWKna9epf8PY5Eknvn+SYu3iCohX6dqyq9zRTOQPoSYGgkjNBVFJKjFIS63A4GO/B3e1cEHu373Mzi2SPbBajKRWhgc+5k5VqlLOTVyQy7AWFo9Ox5BMp7SlwNbjJRSv20qJZGMp5b2Y9ORwUqSssj/a55yZ0PmuMz3utqUK7vHgZkWm28MaJ9dzukjWho1s9nU5kH/lg79/NmXx0t7rAZsxpXN6XLgVW/dpJ8/8swwhk/lX6+90ejfYzb/jleD4+xO1ZSb2+tEa7r8XKYkTr44ol/Xtqyp4DrQauY4Hk0ajnkq3RzULI03VFgjsksNnvjmccP59mXN8Da59fMMjut/neNSqCVwD3zuAACgtceP1//epYZymGznj0/hZ//2Etp7/dh+wwo8+a3jpry31l7Wjdf/7qUFd5iNYvx8EA9+4SBmxgqv/QsAwiGw/YYVuPkdWwyXG+ccl7ebdlSprPqZH57ST3ubXYiGFr6fnv3RKTz/4GnsvnUNrr5rfcW2haheTY3MYWwgqJ9vbvOif3M7Xk6vef/iL85h4PAE7v7o5fA1u/M9jM4YHNf/Gsf5rN7ehfW7enBq/ygA4PFvHMO9n7wCQjT2d9nUxTk88PkDmBkNAwLYtKcXv/E7l9jy/zI9wk7V5eha0ay9/jDGKB2LNDRTg+MDDw3gwEMD+nl/qwe3v38H+ja2m7uxJjMlcyyEeIsQ4nNCiCeEEDNCCCmE+IoZj12vCo3E+Vrc8Afc8DZnDornOBcG0fDSOvjWk9YcDSVmRsM4/OSFgvd76nsnEJ6J4cKJaTz0xcOmDbqcOTiGi2dKK+urVy8/fr6owBjQRmRffnwIwUnj7ePqe73MsmqX2zh6WwlSSgQnMtu+dkd33tumEhL7fnbW0DuAiIpz+Cnjvr2p1YP+zR166SMAjA0Ecey54aIeT52/3NTamJnjede/ZaNeCjp6btbQeKhRHXpsUA+MIIHjL4zojZnsZnZcCY57GBwXK986xp0rmnNePs/Xkn9wLjwTw/M/Ob2k7aoGs8qq/xjABwHsAsCWf0WIhY0HiA6XgMMl4A+4cd2bNkIIgc7lmTfg2FAw+yEaSiqZwqwScAQ68893aASX3NiPntUBOFzCkK2NFJibPjMWxsXTuQPY+fdfqT8qBj0aNdB1OIr736mDFLFIQp/D63Q7yh4Iyi69r4TZiQhiSgn4jW/fjC1XL0dTqwdX37UefRvbDH9rKiUNvQOIqDhhJZjtWN4Ep8uhf85UapasELWvgdrfpBG1dvuxfH2bfn56tLj/YT3L9T/IHsS1i6hyvF1MVQVpdtzYj961rYbjlt61rbjkVf0F77d+Vw9WbevIe8xz/vh0zR8vmrVH/BiAQQAnANwE4BGTHrduqVnQuz68C6u2dy64TfeqzKjN2GAQMiUbtmx1diKCVHquQlObp+xS03oR6PThNz91JQDgxN4R/PzfXgIAJArscE7sHcl5eUuHF+/6q+vL2o4f/P2LGDo6WdZ961V4NnMQe/fHLseKTe05b/fNzzynl0mqlSTh2cwAhz/gLruMrbXHDxzRXpvpscoc7I2em9VP929ph8fnwmvfs12/7IrXrwUAfPEPn9TXVLX7/DUiK6jHDFfdmQmIr7h9Ldp7m/TvgJkiB8LUQa1ym/7Vk7Yev/5dNlOh/aWd5BpQnW/IZDfxCKsOy+EPeHDvH11R8v3cXifu+sjlCy7/2v3PYHJ4DslECuePT2HNJV1mbGZFmJI5llI+IqU8LovtCESGdYvzdYlsbvfAH9BGueKRZMUOcO1gShkNZ0MFI7V8NhHLH3jkC47ZvdFcc1nBbT7q66YudaQG102B8ucCtnZlqitmiyzzLpUaHPesbs17O7V75WKdrYloIbW6xOM3HuCrax6rJaSFmLFcXD1R/4czo/bMkJpFSplzgGBO+W6yE0O/Gg4EWWb19kwwPPDyhIVbsjhbdasePDqJh790GE9974RtR7DmqaPA+UqahBDoXplprqQ242g004ZW/JwzonJ51OA4d+Z4amTOEMioCq1XR6UzBLet+YNbtWmFMXOcub+/wP0Xo85Lr0bmuGd1/kZw+f5WIiqOOqDu9RsH3QLKQNjMWKSolQvMWC6unlRjf2kXkWA850C7WtVkJ8YqCQ4EWWXVJZkK2XOvlNZdv9pq5l0ihNib56qtgLYjf/ALB/URoPBsDK951/Y8d6l9xWSOAa20euCwVuozNjCLjXt6K75ttYiZ4/xcyprP8TyZ4xMv5M4aA4t3HqTiJWJJPSPjcIqCn21jwJg5mDWWVZsTHBebTSqFlNIQHPcWmTlOMnNMVLJCA+q+ZjfcXifi0STi0SSioUTBpjhA9nJxNXMoaBm1UVOjl1XnK82P2DBzLKU0llVzIMgyKza1w+ly6EvXzk5EarZ/kG0yx7PjEUNpxMl9o0jEa3tCdz5SSsQKlEipuldlsjGjzBwDYOY4mxocJ/N8Jk7svZj3/vx/mkctO/MHPAXnC+cLGOcMZdXlNw9pM2RCissmlSI0FdUDebfPWbALaL6BACIqjvGYwRjMCiGM2eMiBsOYOTZSBxNnxsKm7y/tRB0cUL/C5myYOU7EU5h/KZ0uB5xO24Q9dcftcaJvY6bx3cDh2i2trpl3iZRyT64fAEcAY1kEoM0hGDxsz0ZAiXhKby7ldDvgcuf/YuoxNOXKXRbbCJg5zk8tq86VOZ64ECq4BEPHcv4/zaJmfQuVVAMFyqpnjAF2ubzNLn2UPBFNmj4VZeSsUlK9KlCwWaBxfrU9BzWJrCKlzKo2W3jMYAzuFp8zy3mYRt4mlz7okIilDEtdNRq1GVfv2kxFUNiGmWPj3Hq+z62mzjs+V8PzjmsmOF6MWhYx72R60Xa7KTQCnK2tt0kPfuamYw25w04mUphVRjJbuU6dgVvJHOeac6w24lp9ibErusMparasxY6MgW3hrG++JlXhWXOCYyEEWrsqN49udMAYHBfCzDFR+RKxxQfUS88ccx6mSghhbMpVoSaGdqCWVS9Tg+Og/Y4/WSFRW9Rj0MEjE/p+rdbYZo+YnTkGgNMHRpFMbrFdmYRh7tAiwbHDIdDV36KvT3vsuWF9YW6314me1YGyl3qxg0gojnOvjOtlMS0dXkMwSFlBVlbmWEqJfT87q5/fem2fYbSuqdUDh0mfn/HBIOJJiVOjQRS7u3M1ueDvLi44D/hc2N7XWrPv95mxMC6cnNbPLxbYqgHjxPkgho5plTBqlcRSulUDWgfW8fQa6SeeH0HvmlY4TFgOTkqJw7++oJ/vWbNIcKy8R0fPzcDb5ELvmoBp7z2yl2Q8hYtnZ9DW40dzm7fgbWfGwpidyB2odPW31PW6pRMXQgjPxhAJZao+8g2oq93pL56e0fcn+agDecyoadp6/Hrj05mxMPo2tC1yD3uYOB/KGdjmOoaUKYmTyoC6IXM8E8/7vhJC65FTzEDL+PkgAh2+RZNDZjBUSHAZJ8t1rmhGU5sHc9MxROcSOPL0BXSuaMayNa01tVStjYLjhZnjaCiB88ensGrrwjWCa1mxzbjm9awK6MHxr79zwnDdxj29eN37dpi7gTVicjiEb37mecN8TM6PXahQ5vi5H5/WS3ZdHgfWXtptuD5fp/RyZL83i/WUN45f+xd+vnO5d89K/O97d5b1PJV07Llh/PI/XzFctlhgqwbH+381gP2/GlhwG3/r0g781VLLAw8PYGxwFnd/7PIlDzA8/OUjCE1F9fOlZI6f/dFpPPuj01i2rhVv/m97anawgyojEU/ia/c/i9nxCIRD4M4P7cSqbbm/ww8/dR4Pf+lI3sdyuhy491NXoGtF/k7pdvXcj0/j+R+fXnB5vgF1tUrk1IujOPVi8ZV1zBxrsucd14NnHziFF35yJu/16y/vwe0fuFQ//+A/HTQMxnSuaIbL7UAinkIykcIP/u7FvI/lbXbh7X9ydcEBr6e/fxL7fn4Wbq8T77j/GrR0FB4cWyo2nqstQgis3taJI88MAwAe+bK2f+/f0o57Prbbyk0zsM2wfTxH5hhASV8AtUI9qCxm1FudwJ7txL6Rmi1LWKrTB8YWdLYttJZqo3K4hN40I5WUSCYz/7PTB8b00ys2dcDtdWL19syB6IbdS+t+HjDhi217vPjR3B8fvLD4jSxw7PmFDc86+grP5W5dJGPudDuWXPI+X2Uyb+jYFOaml1Yal0pJHEt/sQHaPqx9kXnr6kHnvIunZzA9Uh8HoFS84VMz+pxGmZIFv8OPPZe/kSCgTblR93H15Oizwzkvb88zQNy1sgUoY5zJ43PCv0hn60ZhCI5H62PfdOTpwt+Zp14cRTw9qB4JxXHmUGaJHZdXa7TY0ddc1HNFQ4mCK2MAwL6fa5Vs8WgSx3N8b5qNZdW1Z+1l3QsuGzo6VVNz2k0ZRhFC3APgnvTZ5enf1wohvpg+PSal/MRSniMezbzBl69vw/AprXzx1P5R3PjWzTWVjl/M5HCmOVIxy+hsvGIZxgaDevYYAM6fmAIkAAmkkik4HPX3oVcz7IEuH1Zu7cDuW1dbuEW1SQgBl8eplw8lYyk4/Q4kkylMXsi81264dyMA4Lo3b4Tbdwa+Fjcue/WqJT33FW9YCymB2YkIRmejODWa6age8Oc/4BISaAtpQXwLHLhqXYHqDwk8d0YrBY8kkpBS1ly2UQ04e1YHsGJzOzZfubzAPYBt16/AzHgE44MLu9A7XQLbrl8Bb9PSDlo3XtGL8cEgXvzlOf2ycDCO5vbyBzVCU1HDgNyt771k0VLtna9ZhUgojqmLcxgbmNWnyYRnY1xnu8FkN4ZLFFj3Ws1g9awO6GWRsxMRPcBWyybrhZQSc9OZQfS+jW0QQqCpzYMr37Au533aevy4+R1bcPyFEcgiB8xdbgcuubHfsOJBI2urs7WOE7EkghPa+0gIoG9ju37dxdMzelVZJBiHu9NpaMQFAL/x7u3w+Fy46e1bsPdnZxCdy13hFQ7G9WONwSMT2Pma3McVqaTxs16NFWfUbTazUo7Kt/7yHlzx+rU4f3wKw6enkUr3IUkW+C6oNrPeKbsAvCvrsvXpHwA4C2BJwbE653jNjk5Mj84hPBvH3HQMw6dn0LehDTIlMXxqGmdeGoe3yYXLX7u6JoPmiQuZZYkWyy4B2rzj69600XDZv37kMf2gIJWUQB0O/MaUg56dr16Vd4dLWsn0/PshEU/B4wemhue09waAQKcPHcu10d+u/hbc9n5zSvHbeprw2vdo643/+xOn8I2faEHsu69bi/9+1yV57ydTEv/0B49ASsCVAr7+3qsL9g5Y/8mfICUBKYFkSsLlrK3PtXoge9sHdhhKHPPx+l248a2bK7lZcDoduO7NG3HxzAzOH58CAESW2FQlu5NpvpJYVVOrB7e8cysA4CdfOIgzB7VsX9iGS4PQ0kTnjK95oXWvo6HMge3r3rdDXy7swEMDePLbxwFondjrTTyS1PtHuDwOvPHju4saELzkVf245FX9ld68utXaozTkqoPM8bTyNwS6/XjjxzNlq1//82cxcV4LaCOhOAKdPkMjtzWXdmH95T0AgGXrWvH637ss7/NMjczhq3/yDACtOimZTOX8Ps/e3yeqsOa9ur9Z6mAzmUMIgavv0sLDL33qKb2nxPzxai0wJTiWUt4P4H4zHisftaza43dj3WXdeCXdEObgwwM4uXcEJ/aNGEqWIYHdr1tTyc0qiyFzXGS5SjaHSwDpPzVVp91fuXB78bSRf+1LYH7e8ZiSkexaWfk5eUGluiOwyBw24RDwNrn1zFA0lCi49JHb6UA0PaoYT0q4aujtIFPSsP7jYks4WcGnlE1GQsXN785nVjmAUpsAFUvt4j1XQ2VUVB1qNhhYmE0y3FY5sPU1Z/Yp6vJ1uTr0211IGWxrai28XjqZp6XTB+EQkCmJ0HQMiVjS1ln1qZFMIia7HF+d0jf/mVQHPltLmNLT1uNHS6cXwYko4tEkRs7M5mxmpr6vAWN1YKUwc1zbhJLoqKXg2DZzjmNR47yB9Zdn5kqe2DuCAw8PGANjAIceHay5+bgyJTE1nNlhdS4vMzhWRuWSBQ4u7IxdBounfoHPzx9Sy3W7qxEcK4MZLUU0vvAqB7vZ2aRsHuX9Hqux93skFNfLGL1NroLrllvFcCC0xMyxusxHoKzgODN4UEtzjKg6sksz8y3tlUym9EFxIYxNo4z7u9raH5hBnaaxWDdvMo/T6UCgM/P/nhm393JOak+H9l5jlaLxO0H7/jXu24tvfiqEMDTGHTySe/3a4KS1wbGHwXHNcarBcQ3Fa7YJjrMX8l65tSPn5Hpfs1sPpIKTUZw9VFvNOmYnInopiT/gNmR0SuGs0dEWMxm7DNZewFFLXDmWcxobUjLH/dXOHC/+vs715ZyPR+l2HK+x4Fhde7wWs8ZAduZ4aaXMhuxCGcFxkyE4Zll1o4kWmTmOZR3UqlOkFlvb3e5CM0rmuK029yn1qp46VquZ47YFwbEyOD2fOVb+3lIHPldu69BPDxzOHRzPWZI5VqpPWFZdc9T9ei3FMrYJjg0L1ntdcLocuDxdMu1tdmH79X2468O78O7/dT123JSZc/PS40OGx0kmU4aD2WqbUBokdZSZNQYAhxIc19IkdjMZXnMuNVFQrjLDameOZ5XguKWI1ytXWVc+bjVzXGPvdzXLU7PBsfK/Di8yELGYcrML89SyamaOG0+xmWN1n5B9UFvvZdWGfQozx1VVV8HxRaWsellWWXWOAVN1377YagrZVm7JZI4vnp7JufxqMKu6M8qy6oanxjLFNhKsBtu8U3LNP73i9rXY8ap+uP1Ow+T/S17Vr3VnlcC5lycwPToHQODlJ4Zw+KkLiATjuPqu9bji9Wur/FcAk0pJdcciy58Uoq4bWkujLWYylFVzznFBxkyKNgA0PwjkcjvQ2lP59aFnlc9ooIiyamNwXPhL0u3K7EBrL3NsnB9Yi0oZiFiMOueYZdVUqshccZljw0Ftc3ZwrJRVR2trf2CGkKGsujb3KfVKDQpnRuu5rDrzvooEE5BSZlUFlXbM0NTqQVd/M8aHQkglJS6cmMaaHV2G24SylhGMhavbrZpl1bVHXemilqaI2uadki+LmKssua3Hj9Xbu3DuZW29th/+/X7MTka0pY/S9v3iLHa9dlXVmy0YmnGZlDku1NDEztTlu1hWXZj6Pk7Ek4ascWd/y6JL7ZghGMkc9BaTOVbnHJeSOa614DhkKKuuzSyPuo7pYiXshaRSUl8aBFh6cDzHsuqGkz0QVlTmuNm4P1G/D6qxHEy1zU3X/oBbvWqtk+WcYuGEPkDucAm0ZDXY8rUYv3+joYSekHB7nYbv52Kt3NqJ8SHtGHfgyMSC4Hhuyto5xyyrrj1q/yRZQ4k+2wTHpXYu3nFTvx4cz7cJNz5eEt/7m33YuKd3wXUA0NzuxYbdPSU11zl/fEpffzmfoWNT+ulilnHKR31DvfLkBbR05J7jUY7Wbj/W7eouuLRONcyMZV43llUXppYZntg7Ylgepbu/uEGY2UgcPz00jPFQedm8gcnMgUQxDbnUbObZl8YLltRsmwK6I9pjfu9rh/M/fpcX6PFWtbtr6vlR/fTB8VkcevRk1Z67WHIsc1By7vQ0vvBP+3Lezu92YuvyALzp/V73yhas2t6p/z+nR+b0phn+gNtQsVAstaw6OBHBvp+fLep+gU4f1u/uqch+aW4mhpP7RupyzdxK8Ac82LC7B5DAiX0jJQ24BLO+j4OTud8DYwOz+unsJVjU/V1wMlr0e6gY/Vs6sGxtq2mPV6p4LIljz13Uz7OsurraemqnrDoWTpT8+ZqnrgTQ1u1fMECufv+OnJ3BCw+e0c8Hunw4PRbCQ4dHkCih1FXGM5/tA0+fx8HRWeP1p43nZ6ejeb+LDIQA+v0QgdKD25RyXPLtg0MQpyofIDsdwC1berFpWaDiz2V3aqLvyLPDlk57Vdkm4lDXvM3ViCvbmh1dCHT5MmUiAli9vQsenxMn9o4AAEbPzWL03Gzex5i8sAbX3LOhqO27eHoG3//bIj7kCrMyx4ceHSz7cfK57k0bcfmtq01/3GJlZwNYVl2Ymjk+8cKI4bqulcXtoD/9g5fwg/3nTdmexZZyAoxfzkNHJzF0dDLvbbWVlNO3PxJEoa/rr7ZEcd5VneyykMAnpjMHUz85PoKXz16oynOXoj0p8D6kMwdzScgDUzlvNwdgH8YNl73h9y/D2su6AQCPfvWofnk5840BYxY7Hk3i6e8XP5hwzfh67LltbVnPW8hP//kghk/NmP649Wz49LR28J61vynV3HRs0feAr0BZdSQYL+k9VIx33H/1kr6fl+Lp754wnGdZdXUZ5hyPhiGltGwprUe/dhTHn7+4+A0Xkd2MCzB+piaH5wxT/po6vLj7//zaMFWqGG4JfAg+OCGAUP7vGV1SLn6btLkDE/jX1gjiJb4UH57zwQvtTv/w+ElEq5Tz+btfHsPTf/QadDTz81uIGsu88sT5BasOWcU2DblKXdbH4RB4w+9fhk1X9GL369bgnX9+Le780E5cfff6op/z1IHiO12fKbErdvuyJrR0lD8i3Lu6siNSi2XAK218MGQ4r3ZjpoV61+R+PwgBrNzakfO6bE+fGl/8RkVY3upDb2Dxctvl6xeug2iG/kT13ivtKeM39XlnbZV8z5t1SARFeSVLaufRGWW+cWeZlS8OpwPL1pWXmVMzamaJzsUZGJfh/LEpXDg+VZXnyn6/NLV50NxeuYyqld9/509MGc7nCmyocnzNbjjTxxuJeMrSapLBAgPGpVi5ZeExQOeK5rxJB8cyX8mBMQDEBXC6QgPTTVKgN1nad7tTQg+MU5CIVnGMIxJP4eXz/F5ZTE+FY5ly2SJzLKXU5wu73A5DSXEhXf0tuPW9OwyXZTclAGDMkErgxV9pzbymhkOIR5NFBeNqBnr95T2G0pxsbq8Tm69atqTRyKvv2YD25U0L1o1biumRME7t10pErV5vbPx8Zs5s75qAZSO3drH12j443Q5MnM8MKggBrNrWic6+xTMgUkqMK+vfvvu6tfCWMSDhdTlx184+w9JL+fSsDuCOD+7E0LHFDwCiiRSOXZxFKJr7C9s1FoNzSis9u2Z9J3Zvqnx3bgBwXYwAz2S2/zdfva4qz1uWmTii5yNAjnk98WTmi7zJ48LdG3tx6kVtXzDfwTQWSRjmG1//lk1lb8rr3rcDR58ZztnRdAEJHHhkAKmExMT5EEJTUVMDI0PGpM2DLVcvN+2x600ynsLBR7RKpfBszPA9sfPVq+BwFbefdnud6FrRgtGB2UVXW+he2bJg+pPT6cDdH92FY89fNEwhWYpzL09gPL38nZVNLtU5km/4/cvKmrpAS+PxORFOv6/i0aQl07pSyZShYeHlv7EaKOMwqH1ZU859mrfJjXs+djlO7R81vN/be5sw0ukElELID9xUfFJJRJOInAtD5Fl/XDoFkl0eOCdiEHn6Dahcw1E4g9pn4p4ty5BYWcL6y+Ek8It0ZYvXiQ/cXPzfUa4HD13AwIQ2iFxr/VFq0RWvX4tAp0+f/tr0Sw9QAyvw2iM4Vt5fZpTX3vb+HfjZv74EIYB7P3nlgpGLMy+NY/JCCFJq8576NrYv+pijyvyoa+5eX/GSLK/fhctuWWXqY54+OKYHx1JaHBwrDaXW7ey2cEvswelyYOs1fWXffyac0OcWtXhduP+uS8zatILW7Oha0LQjn1sKXPf090/q8w5v2tSDK25fu/SNK8KBhwbwZDo43v6qFbjl9q1VeV6zjcxEcNVfPgQA6G5x4s9et0YPjuenpqjLgnQsb1pQ6lqKQKevpNUCRs7NYOjoFADg3CsT2HZd+e/1bGqTxL4N7bjuTRtNe+x6k0pJHHx0EJALl2S67s0bih64nrf+8p6yt6VjeTOuvtO8g9149GhNBMcR5f+6YlO7ZdvRyNxep74GezySBCpT5FRQOBjXk0K+Fjeue7P5+6XeNa3oXbOwiufsoczUoFu3L8Mnb99m+nMX68lvHceBhwcAAK9Z3YXd6SVcizF6bhbfSgfHPd1N+FAV/o6TIyE9OI4xOF6Ux+fCpTev1M83f6Y2eizYolZVDdTcJozgbdjdi7f+8VV4x/3X5EzpqyXLIwXmJM8LTUf1dQldXqdty6DU5KzV643NH6QAWgUAVdZYKJMR7Gqx3xwZQ2FBFQd2pkcyAWOhapFap1ZmSCkRUDqbzo/oqmu0F1ONYKbV2zMDKGqZtxkMy+stoUliI3A4RM6Or6VUdNUqde7bYtnsSkkmU0iky3iF4CoNVlGPM60qq56zcDmvkLJ2eDHNNSuppTMTLOVqrluI2tzJX0Yzr3J4XbW7sgYVzxbfZmqgVkwzrmJ0r2xB+7LcB0JqwFyoYVeu2/SsrM6yOZWgbreVwbGUUl8OAGBwXA1js0pwbMMGEkJ576aq+H00PZp/HUk7car/PynhD7j1ef6xcALRuTgmleC4o8rB8artnfrpgcMTpu6fzFp7vlHkOsish4aJahd0qzLHsaw1WYVNjyXszqMMSsTzTOWptJCFy3mp05eaLQ6O1eUCszvdL0YtS1eXEKwktzLIFrNokI2WzibBceZ0NUZSe9aUFhyrS0501+jk8mJYFWBkm5uO6Wtcun3OstZSpdKoyzd1t9RGWUsphEUDO1Nq5rjXvplj9Rg8JbVMsvq5mxmPYOKCdRnW7v4WPSiLBOOGaSxLZQj6LepQbCe+llzBsS1maBWkZo5TFmV81FL17OWrqHrUwZ5YxKLMsZL1rPZyXkElOG6yuHrBWMVUWo8ddTmrag0wuJ3MHNcDewTHUs0cV/5LuHtli16mOXkhtGhZzehApgS4Z5V9s5xWBRjZDCXVK1rYjKsKxoNqWbX9gmOHsier1nz5ZCKVWSoO2lqSdqV+xlLp/58aHM+ORwxBZLXLqoVDGLLH514xp7Q6GU9l1jIVyFtNRBn+HNMuzKrospJDKYdMWpQ5jsxl1rP1+u0/4GBXbiVbGrcqOFYyx9Uuq56LZYLjFo/FZdUdSuZ4ssTMsQVl1W5lPxKzsHcBLY0tgmO1I2Y1yrc8Phfa0xmE+aZchRjKqm2cOTYEGBYGx2OG+cbM5FTDWFDNHNuvrFqddCyrNFg7Ox7Rpze3dHgNa6/ajZo5nv+b1HWMpy7O6UGkENaUkBvmHZsUHE+NzGX+3k4fOwMXwZerrLoO5sY6lU7bqSK66FZCzJA5ZnBsFY8hc2xVWbWa9azugHVISQg1WVxW7Q+44UwHnNG5BGLh4l+P+aZq2uNU57jGo2aOWVZtW7YIjtVEULVa6hfblCsSiuvZI4dLVH0unpkM2SMLg+MJzjeuuvGQveccWzFfvl5KqgHAkStzrDRCOffKhL4fbu32WzIQsGpbJnM8fHLalINW43xj++67q8mfq6za4gNoMzgc6pxjllU3MjUJUwsNuZqq3ZBLKatusXjgSwhhbMpVQvY4bEFZtceQOWZwbFfC6iV7FiOE2Lt1447dH3zNPwAAdr52FW7Isb7mjw+ex3OnJ/C+V63Hqs6lZzUOPDSAJ799HADQ2uNHd54gLRqO60uM9K4J4N5PXrngNsmUxImRIPYPTOLA4DS+s3cQb7tyFT5+6xY0e5z42nPnMDwdwQdu3IC2Ur4QIzPAKz8EBp8Dtt8DbHyNdnE8iQvTEQxNhjE4OYehqTCGpsKGHd76yMu4ZfoHWBM9ikdb78bDbW9CUzCJjQe1g8WEEwi1FT7gEUihKRVEc3IGvlQYQWcrJlzLit/+NLeMwpea03/mwsuRSGnBxo4V30Crf6jkx6TSTIfjiKTXddy5sg19bfaa5/3iuR146tTVAIA2/zS6mhdfO3mpZiItGAtqy4xt7zuCW7b8uuLPWSnJFPDLwxcBaEtp9rZ6MTa7BcdG7khfloSEdpDU0XQS2/p+YMl2Hhi4D6GYtuZtq28ALmdpZXbZIvF2zMW05YT62l7Auu7HlryN9e781G6cGTcurNbVfBRblv/Yoi0yx4Wpy3F6/NUAAK9rCs3e0apvQzTeilBM+w5dFjiIDb2/rPo2EHBu/HoMTl0DAPC7x+D3VP77JNtMuB+JlHYse8mKb6CtisdBF2cyg+U7V7Whr9Xa44Ef7r8Ng1P9AIC+tmH43cXt94em+hBNaIH1W3b/EMtaK7+A7rGRIE6NagmeZq+zpG7fl6xog8fZgNMIb/0LoHMdAGDPnj3Yt2/fPinlHis3yRbDvYY5xzlGsQ5fmMGHvv4ipARGZqL45/uW/j/tVZpyzYyGMaN0pc2ne5V2n5HZCPafm8L+Ae3n4OC0ocEBAHzp6bNo8boQjCbwpae19VmdDoGP37ql8JOkkggfewSxvV9Fy6kH4UxqO4nw/u/ivs6v4ex0AqOz+ZsWtGAOf+j6Bu5z/Uq/7K3jX8APL7Rjf+xSbIS2E3QlgbaJYjIzTYiiCfPP2IZysjlOAAHEEEAs65prEg/AG5rLdScy2/xH60L6x0YcIQDQguPpcBumw9VdmLI9+AxwxL7BgRPAbequNQQMJ0ZxDFpwLJG5cp04gMtDT1Z3A9PC7nV4MfYmAMBMxNx13rfI53CJRX+XnTQlHDiTtep4b+qcZe8Js7jjTTgNLTiOJtoRTbRbuj0rUids/z+1K5noxiC04Dgc70Y43m3p9uyKPYH21PnqPaH6XXA+/WOhluhaAFpwfGF6eVmP4R/4CeCs/IDXZgCb5/9/ifRPsY6bvz22cOP/Z/UWLGCP4FipTPDkaFLx7RcG9ZK/gUlzAqneta1o6/VjemTxoHjegzPT+OO/fhhDU8Xd5wuPnjScf+70BKSUmJyLG7K+g5NhJEaOYcfYg7gp8hD6MI7sIk5/KoSTgxcwiYULus/7DccL+HP3F9EnFs7Xe4/zZ/iAcwdmRAqtsjaq7Vd79sHrYGBMi1vl3Q8xmzQEcdXiQALrvM9V/Xkrrcd9Eq3OYcwk1YORFDb4rMuQb/U/ggOhO5GCuSWnLhHBWu8Lpj5mvVrlOQCXCCMhM99C67zPW7hF5ljlOQAHEkjVyGER34/WWePdh2eC77Tk+yRbl+sM2pw2G6022QbvMzgSfk3Z9+9xnUTAUf1KELIvW5RVb1qzffdHbvscAODVv70V265boV8fT6ZwzV8+pC9Fs2VZAD//2I2mPHcsksD5Y1NIpucNSAmMzkZxaiyIM2MhnB6bw+DkHJIpiTGnxKQz//+yJ+BFwOfSyy1ycTsFXA4HwnFtjksrQrjD+Qze7HwcexyLDyntjvwzJtAKhwD62vzob/ejv8OPTU0h3DH091g9nL9Ea7znKpzb8A60XHwJkcEZ+INDEHLxuTZRXw8gk/BGtYBbwgGB0uZZJJ1+RJqWI+xfjkhTH+KedjhdEq09UUOTMKosAYHNywNoclt/QFCOYFDg4nD13zDLlqfQ0lLb+9FiJFISRy/OIpbIfO6TcYHpMS9kSiv1am6PwddszRy8edE5J4KTJs4fE0CgMwqPj/PDihWPOjAz7gUk4A/E0dRqTdMis8UiDsyOW9+tv7ktBl+LtZ+zRmf6fqYMwinR1h2F02XF94vA5mUBNNdIk8KJCYHJidK/350uYOXKJFxVHPMaC0UxMFF6Ykcrq27Ag951rwL8HQBYVl0StTmU12/MGDx6dNSwRmvcxAV651IpnPGmsH9gCi+em8KBwSlMKUstAMj5H/S6HLi0vw27VrXj8tUd2LW6HSvafPjG8wP45PcO5X2+eFIimYzjJschvMX5GG517IVXxBfcbkIG8LD7JrzY+Xp8avyTaE5OAwD+9b7dWNa3CsvbfNpaa1ICL34Z+MUfA5HpzAM09wAh4yha1+hz6BpVsl+5jg/czUD/bmDVVcDKq4CVVwLNXcAjfwk89j/z/l06XxvQsw3o3Qr0KD+B5YZuw0TlaEn/UHlcAC7ZYfVWEBERGXWmf+ygO/1D9mWL4FjtPpu9vMF39w4azifKXFcsnkzhyIVZvDgwqc8XPjWWP8urWt/djF2r23H5qnbsWtWBrX0Bw0Lg82I52rr3t/sRjCbQGzmNNzsfxxudT2KZmFpwu5RwYWbVq4Fdb0f7pW/AW9xevAUA/tengfQA1RVrOoCWdDOy8ZPAAx8BzjxhfKBd7wRu/R/A/1q3+B/WuV4Lglddqf3u3a4Nw2Xb8Brg8b8B5jPN/g4tCO7ZAvSmf/dsA1p6GQQTEREREVFNsl1w7FGC48lQDA8duWi4baKI1ulSSgxNhbWGWeem8OLAFF4amka0iDXJ2pvc2LWqXc8K71zZhvam4kpvsssstrXF8cUrT6Hr+HfgGt6f+059O4Gd74Dj0regvTnXWFRWsJmMA099Dnj0r4Gk0pirYx1w52eB9Tfnfh53E9C/R8sGr5rPChc59rX6auAPngWCF4HuzVpmmkEwERERERHZiC2CY2NZdWaTHzh4HvGsTHE8xxqnwWgCBwe10uj5DtKFOjrPczsFtve1asHwai0rvLarybAecCnu3LkCX3zyOG5yHMD7W5/FVbFnIZ5YWDaN5l7gst8Edr0DWHZJ4QdVt2VoH/DwXwAXldJt4QSu+yBw0x8BHmWJq92/Dez7knb6Tf8GXPKm3FnhYnVv0n6IiIiIiIhsyBbBsdozTC2rzi6pBrTy6KPDs3jx3KQ+V/j4yCxyxMwLrOzwZ+YJr2rHJSta4TOrOdHwIVz28tdwqPUb8McmgOxl2pweYMvrtYB4w2tKCFSV4PjrbzVe1bcTuOtz2u9sN/0h4HADyy/VAnEiIiIiIqIGZo/geD6yFYDHp23y8YuzODCoNZkSIhNAT83F8brPPr7oY7Z4Xdi5qi1dIq0Fwz0Bk7tUBkeBQ98GDnwNGD4EASxYggn9e7SA+JI3AU1ltBvIlcV2+YFX/3fg6t/LH2S3rQTu+LvSn4+IiIiIiKgO2SI4nuf1uyAcWjD4nX2ZrPFNm3vw6NH8a5g5BLB5WQCXr27H5au07tEbelrgdFRgXmwiBhz/ObD/a8DxXwCpHEtcBPqAy96qBcU9W5b2fCIrs73+ZuCOzwKdRTTcIiIiIiIiIgA2C4496fnGyZTED14c0i+/75o1mI0ksPfsJACgN+DF5aszGeHLVrah2VvBP1VK4MJ+LSA+9B0gPLHwNi4fsPUOYNfbgfW3AA6TyrU3/Qaw7/9qHaJf95fAzrezGRYREREREVGJbBUcz883fvLEGC7OaA21ulu8uHFzD67d0IWXhmawssOPvjZf2U2zSjI7DBz8lhYUjx7OfZtV12gB8SVv1Nb5NdsdnwX2vEvrEu0NmP/4REREREREDcCWwbHaiOueXSvgdjrgdjpw1boqLBEejwBHHwQOfB048StA5lj+qXWlFhDvfDvQtaGy2+NwaPOWiYiIiIiIqGz2Co79bsxE4vj5y8P6ZW/es7LyTywlMPiC1ljrpe8CkemFt3E3Advu0uYRr32VFrQSERERERGRLdgqOPY0ufCTgxcQTWjZ2u19rdjW11q5J5weAg5+A9j/dWD8eO7brLlBC4i338WyZiIiIiIiIpuyVXDs9bsMJdUVyRrH5oAjPwH2fxU49SiAHAskt6/RAuKdbwM61pq/DURERERERFRVtgqOw5B4Id2R2uUQuHvXCnMeWErg3DPpsunvA7HZhbfxtACX3APsfAew+lqWTRMREREREdURWwXHL49lgtabt/Sgu8W7tAecOgcc+IbWXGviVI4bCGD9TVpAvO0OwNO8tOcjIiIiIiKimmSr4Pj5oUwjrDfvLrOkOhoEDv9IW37pzBO5b9O5IVM23VaFhl9ERERERERkKVsFx8PhKOAG2pvcePW23uLvmEoBZ3+tBcSv/BCIhxbextsG7HgjsOu3gJVXAtVYJ5mIiIiIiIhqgq2C40g6Xr1r5wp4Xc7F7zBxKlM2PXVu4fXCAWx4tZYl3vJ6wO03d4OJiIiIiIjIFmwVHEeF1jm6YEl1ZAZ45Qdalvjc07lv07MV2Pl24LK3Aq195m8oERERERER2YppwbEQYiWAPwdwG4AuABcA/ADAn0kpJ814joiQ2NjbgstWthmvSCWB049p6xEffgBIhBfe2dcOXHovsOvtwIrdLJsmIiIiIiIinSnBsRBiA4CnAPQC+CGAIwCuAvARALcJIa6XUo4v9XmiQssai/nAduy4liE++E1gZijHhjmBTbdqAfHm2wDXErtbExERERERUV0yK3P8BWiB8YellJ+bv1AI8XcAPgbgMwB+dylPkIJEUgBv2tYCvPCfWlA8+HzuGy/boc0jvvReoKWExl1ERERERETUkJYcHKezxrcCOAPg/2Rd/acA3g/gPiHEx6WUOdpEFycpEvhax79g2b++B0hGF96gqUubQ7zz7UDfZeU+DRERERERETUgMzLHt6R//0JKmVKvkFLOCiF+DS14vgbAQ+U+SbdjFNeEHzNe6HADm1+nLb+06TcAp7vchyciIiIiIqIGZkZwvCX9+1ie649DC443o0BwLITYm+eqrQDgFUrSuW+XVja94y1Ac1eJm0tERERERERkZEZwPN86ejrP9fOXty/lSRzOGHDdh4Cd7wCWbV/KQxEREREREREZ1Mw6x1LKPbkuF0LsdTUldi+79y7ghjXV3iwiIiIiIiJqAA4THmM+M9yW5/r5y6fKfYKO7g7cwMCYiIiIiIiIKsSM4Pho+vfmPNdvSv/ONyeZiIiIiIiIyFJmBMePpH/fKoQwPJ4QIgDgegBzAJ4x4bmIiIiIiIiITLfk4FhKeRLALwCsBfAHWVf/GYBmAF9eyhrHRERERERERJVkVkOu3wfwFIB/FEK8BsBhAFdDWwP5GID/btLzEBEREREREZnOjLLq+ezxFQC+CC0o/jiADQD+AcA1UspxM56HiIiIiIiIqBJMW8pJSjkA4D1mPR4RERERERFRtZiSOSYiIiIiIiKyMwbHRERERERE1PAYHBMREREREVHDY3BMREREREREDY/BMRERERERETU8IaW0ehsKEkKM+/3+zm3btlm9KURERERERGSyw4cPIxwOT0gpu6zcDjsEx1EATgAHrN4WKsvW9O8jlm4FlYOvnb3x9bM3vn72xdfO3vj62RdfO3vbCSAppfRauRGmrXNcQS8BgJRyj9UbQqUTQuwF+PrZEV87e+PrZ298/eyLr5298fWzL7529jb/+lmNc46JiIiIiIio4TE4JiIiIiIioobH4JiIiIiIiIgaHoNjIiIiIiIiangMjomIiIiIiKjh1fxSTkRERERERESVxswxERERERERNTwGx0RERERERNTwGBwTERERERFRw2NwTERERERERA2PwTERERERERE1PAbHRERERERE1PAYHBMREREREVHDY3BMREREREREDa9mg2MhxEohxH8KIc4LIaJCiDNCiM8KITqs3jYChBBdQoj3CiG+L4Q4IYQICyGmhRBPCiF+RwjhyLr9WiGELPDzDav+lkaU/jzley2G89znOiHEg0KIifTrfVAI8VEhhLPa29/IhBDvXuSzJIUQSeX2/OxZQAjxFiHE54QQTwghZtL/668scp+SP2NCiDuEEI+m979BIcSzQoh3mf8XNY5SXjshxCYhxB8KIR4WQgwIIWJCiItCiB8KIW7Jc5/FPsO/W9m/sL6V+PqVvX8UQrxLCPFc+nM3nf4c3lG5v6wxlPj6fbGI78OHsu7Dz18FiBLjAuV+Nfe95zLrgcwkhNgA4CkAvQB+COAIgKsAfATAbUKI66WU4xZuIgH3AvgnABcAPALgHIBlAN4E4N8B3C6EuFdKKbPudwDAD3I83kuV21TKYxrAZ3NcHsy+QAhxN4DvAogA+CaACQB3Avh7ANdDez9QdewH8Gd5rnsVgFcD+GmO6/jZq64/BrAT2udpEMDWQjcu5zMmhPgggM8BGAfwFQAxAG8B8EUhxKVSyk+Y9cc0mFJeu/8B4K0AXgHwILTXbQuAuwDcJYT4iJTyH/Pc94fQPs/ZXihvsymtpM9eWkn7RyHE3wD4ePrx/w2AB8DbADwghPiQlPLzpW82pZXy+v0AwJk8190HYD1yfx8C/PyZreS4oGa/96SUNfcD4OcAJIAPZV3+d+nL/9nqbWz0H2gH4HcCcGRdvjz9gZAA3qxcvjZ92Ret3nb+SED7MjlT5G1bAYwAiAK4QrncB20QSwJ4m9V/E38kADydfj3uUi7jZ8+a1+IWAJsACAA3p1+Dr+S5bcmfsfTrGoF2gLBWubwDwIn0fa61+v9gx58SX7t3A7g8x+U3QTtoiwLoy3EfCeDdVv+t9fhT4utX8v4RwHXp+5wA0JH1WOPpz+Vaq/8Pdv0p5fUr8BjtAObSn7/urOv4+avM61ZqXFCz33s1V1adzhrfCu3g/f9kXf2nAEIA7hNCNFd500ghpXxYSvmAlDKVdfkwgH9On7256htGlfAWAD0AviGl1EdUpZQRaCO8APB7VmwYZQghLgVwDYAhAD+xeHManpTyESnlcZn+5l5EOZ+x/weAF8DnpZRnlPtMAvjL9FmWB5ahlNdOSvlFKeWLOS5/DMCj0DKK15m/lZRPiZ+9csx/rj6T/rzNP+8ZaMetXgDvqdBz1z2TXr/7APgBfE9KOWbSplEBZcQFNfu9V4tl1fNzdH6R4x88K4T4NbTg+RoAD2XfmWpCPP07keO6FUKIDwDogjby87SU8mDVtoxUXiHEOwGshjbodBDA41LKZNbtXp3+/bMcj/E4tNHZ64QQXilltGJbS4t5f/r3f+R4DQF+9mpZOZ+xQvf5adZtyBqFvgsBYJcQ4qPQMiVDAB6RUg5WY8NogVL2j4t99j6dvs2fmr6VVKz3pX//a4Hb8PNXPbn2hTX7vVeLwfGW9O9jea4/Di043gwGxzVHCOEC8Nvps7nevL+R/lHv8yiAd0kpz1V26yjLcgBfzrrstBDiPemsx7y8n0kpZUIIcRrAJdDm9hyuyJZSQUIIP4B3AkhCm9uTCz97taucz1ih+1wQQoQArBRCNEkp5yqwzVSAEGINgNdAO8B7PM/NPpJ1PimE+HcAH01nT6h6ito/pqsW+wEEpZQXcjzO8fTvzRXaTlqEEOJaAJcCOCalfKTATfn5q4ICcUHNfu/VXFk1gLb07+k8189f3l75TaEy/DWAHQAelFL+XLl8Dlrjkj3Q5gZ0QJuT9Qi0MouHWCpfVf8F7cBtOYBmaF8k/wJtPsdPhRA7ldvyM1n7fhPa//9nUsqBrOv42at95XzGir1PW57rqUKEEF4AX4VW/ne/WnqbdhrAh6Ad6DUDWAHtM3wGwAcA/GfVNpZK3T/y+7D2zVdR/Vue6/n5q658cUHNfu/VYnBMNiWE+DC07o1HoM330EkpR6SUfyKl3CelnEr/PA6tCuBZABsBvLfqG92gpJR/lp4fclFKOSelfElK+bvQmt75Adxv7RZSieYPBv4l+wp+9oiqJ738yJehdVr9JoC/yb6NlPIxKeXnpZTH0vvfC1LKb0ObVjYJ4O1ZA5RUIdw/1hchRBu0QDcG4Iu5bsPPX/UUigtqWS0Gx4tF/fOXT1V+U6hY6dbq/wBtOYtbpJQTxdxPSplApgz0xgptHhVvvmmC+lrwM1nDhBCXQGv4MwhtKZmi8LNXU8r5jBV7n3wj7GSydGD8FWjLj3wLwDtLaSqUrvqY/wzzM2mhAvtHfh/WtncCaEIZjbj4+TNXEXFBzX7v1WJwfDT9O998jU3p3/nmJFOVpRsafA7aeoC3pDvTlWI0/ZulndbL9Vrk/Uym55Ksg9Zk4VRlN43yWKwRVyH87NWGcj5jhe7TB+01HeR84+oQQrgBfB3aWrdfA/COdIBVKn4ma8eC10JKGYLWvKkl/TnLxmNUa8034lpQRVUkfv5MUGRcULPfe7UYHM9Pnr9VCGHYPiFEAFqp0hyAZ6q9YbSQEOIPoS3WvR/aB2CkjIe5Jv2bwZX1cr0WD6d/35bj9jdCG6V9ip2qq08I4YNWqpQE8B9lPAQ/e7WhnM9YofvcnnUbqiAhhAfAt6FljL8E4L4yBqrmXZ3+zc+k9fLtH/nZq0FCiKsB7ITWiOvRMh+Gn78lKiEuqNnvvZoLjqWUJwH8AlpjoD/IuvrPoI0KfDk9ekcWEkJ8GtpE+70AXlOohEUIsTt7sCN9+WsAfCx99isV2VAyEEJsy9WASQixFsDn02fV1+I7AMYAvE0IcYVyex+Av0if/afKbC0t4l5oDWR+mqMRFwB+9myinM/YfwGIAvhg+rM7f58OAJ9Kn/1nUEWlm299H8Dd0Aao3pO9DGWO+1yR4zKHEOKTAK6F9l7ItdoDmazM/eP85+q/pz9v8/dZC+24NQrt80nVNV9FVWj5Jn7+KqiUuAA1/L0nKrdGevmEEBsAPAWgF8APobXwvhraZPljAK6TUo5bt4UkhHgXtGYHSWilE7nq+89IKb+Yvv2j0MqNnoI2NxIALkNmPbJPSyn/IvsByHxCiPuhNUh4HMBZALMANgB4A7T1/h4E8EYpZUy5zz3QdmQRAN8AMAHgLmjdHr8D4DdLmVtH5hBCPAHgBgB3SSkfyHObR8HPXtWlPzP3pM8uB/A6aNmIJ9KXjUkpP5F1+5I+Y0KIDwH4R2jrsn4TWhOatwBYCeBv1cen4pXy2gkh/gvAu6Ed5H0BQK794KNqJksIIaGVGx6AVqLbBq0qbge0yrg3Sil/YeKf1FBKfP0eRRn7RyHE3wL4f9P3+Q4AD4C3Qlsn+UNSys9n34eKU+q+M32fVgDnoS1Ru3KRZA0/fxVQalyQvs89qMXvPSllTf4AWAVthOBC+g8/C+CzADqs3jb+SEDrZiwX+XlUuf3vAPgxtFb5QWgjP+fSb+xXWf33NNIPtGUqvg6te+AUtMXZRwH8EtpadCLP/a6HFjhPAggDOARtZN1p9d/UiD8AtqU/ZwOFXgN+9ix7fRbbR57JcZ+SP2MA7gTwGLRBrhCA56GtzWr5/8CuP6W8dgAeLeK78P6sx//f6dfsPLSDwrn0/vjzANZb/ffb/afE16/s/SO0QZHn05+72fRreofVf7/df8rcd/5e+rqvF/H4/PxZ87oZ4gLlfjX3vVeTmWMiIiIiIiKiaqq5OcdERERERERE1cbgmIiIiIiIiBoeg2MiIiIiIiJqeAyOiYiIiIiIqOExOCYiIiIiIqKGx+CYiIiIiIiIGh6DYyIiIiIiImp4DI6JiIiIiIio4TE4JiIiIiIioobH4JiIiIiIiIgaHoNjIiIiIiIiangMjomIiIiIiKjhMTgmIiIiIiKihsfgmIiIiIiIiBoeg2MiIiIiIiJqeAyOiYiIiIiIqOH9/wTLxga2nLihAAAAAElFTkSuQmCC)



You can find further hints for smoothing the plot of an output vector
in the signal processing chapter of the SciPy Cookbook (see References).


## Resources


The primary and authentic source of information on Pandas, Matplotlib and other
libraries is their official documentation. I do not link them here because they
are trivial to find via Google. Instead, here is a random collection of other
resources that I found useful while writing this tutorial (not counting all the
StackOverflow pages I visited.)

- Pandas tutorial from Greg Reda:
  http://www.gregreda.com/2013/10/26/working-with-pandas-dataframes/
- On reshaping data frames:
  https://pandas.pydata.org/pandas-docs/stable/reshaping.html#reshaping
- Matplotlib tutorial of Nicolas P. Rougier:
  https://www.labri.fr/perso/nrougier/teaching/matplotlib/
- Creating boxplots with Matplotlib, from Bharat Bhole:
  http://blog.bharatbhole.com/creating-boxplots-with-matplotlib/
- SciPy Cookbook on signal smoothing:
  http://scipy-cookbook.readthedocs.io/items/SignalSmooth.html
- Visual Guide on Pandas (video):
  https://www.youtube.com/watch?v=9d5-Ti6onew
- Python Pandas Cookbook (videos):
  https://www.youtube.com/playlist?list=PLyBBc46Y6aAz54aOUgKXXyTcEmpMisAq3


## Acknowledgements


The author, Andras Varga would like to thank the participants of the
2016 OMNeT++ Summit for the valuable feedback, and especially
Dr Kyeong Soo (Joseph) Kim for bringing my attention to Pandas and Jupyter.
