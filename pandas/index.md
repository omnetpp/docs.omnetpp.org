---
layout: page
tutorial: Pandas
title: Analysing Simulation Results With Python
generateToC: true
jupyter: true
---

<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<h1 id="Analysing-Simulation-Results-With-Python">Analysing Simulation Results With Python<a class="anchor-link" href="#Analysing-Simulation-Results-With-Python">&#194;&#182;</a></h1><h2 id="1.-When-to-use-Python?">1. When to use Python?<a class="anchor-link" href="#1.-When-to-use-Python?">&#194;&#182;</a></h2><p>The Analysis Tool in the OMNeT++ IDE is best suited for casual exploration of
simulation results. If you are doing sophisticated result analysis, you will
notice after a while that you have outgrown the IDE. The need for customized
charts, the necessity of multi-step computations to produce chart input, or the 
sheer volume of raw simulation results might all be causes to make you look for 
something else.</p>
<p>If you are an R or Matlab expert, you'll probably reach for those tools, but for
everyone else, Python with the right libraries is pretty much the best choice.
Python has a big momentum for data science, and in addition to having excellent
libraries for data analysis and visualization, it is also a great general-purpose
programming language. Python is used for diverse problems ranging from building
desktop GUIs to machine learning and AI, so the knowledge you gain by learning
it will be convertible to other areas.</p>
<p>This tutorial will walk you through the initial steps of using Python for
analysing simulation results, and shows how to do some of the most common tasks.
The tutorial assumes that you have a working knowledge of OMNeT++ with regard
to result recording, and basic familiarity with Python.</p>
<h2 id="2.-Setting-up">2. Setting up<a class="anchor-link" href="#2.-Setting-up">&#194;&#182;</a></h2><p>Before we can start, you need to install the necessary software.
First, make sure you have Python, either version 2.x or 3.x (they are
slightly incompatible.) If you have both versions available on your system,
we recommend version 3.x. You also need OMNeT++ version 5.2 or later.</p>
<p>We will heavily rely on three Python packages: <a href="http://www.numpy.org/">NumPy</a>,
<a href="http://pandas.pydata.org/">Pandas</a>, and <a href="https://matplotlib.org/">Matplotlib</a>.
There are also optional packages that will be useful for certain tasks:
<a href="https://www.scipy.org/">SciPy</a>,
<a href="https://github.com/nicolaskruchten/pivottable">PivotTable.js</a>.
We also recommend that you install <a href="https://ipython.org/">IPython</a> and
<a href="https://jupyter.org/">Jupyter</a>, because they let you work much more comfortably
than the bare Python shell.</p>
<p>On most systems, these packages can be installed with <code>pip</code>, the Python package
manager (if you go for Python 3, replace <code>pip</code> with <code>pip3</code> in the commands
below):</p>

</div>
</div>
</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">

<pre><code>sudo pip install ipython jupyter
sudo pip install numpy pandas matplotlib
sudo pip install scipy pivottablejs</code></pre>

</div>
</div>
</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>As packages continually evolve, there might be incompatibilities between 
versions. We used the following versions when writing this tutorial:
Pandas 0.20.2, NumPy 1.12.1, SciPy 0.19.1, Matplotlib 1.5.1, PivotTable.js 0.8.0.
An easy way to determine which versions you have installed is using the <code>pip list</code> 
command. (Note that the last one is the version of the Python interface library, 
the PivotTable.js main Javascript library uses different version numbers, e.g. 
2.7.0.)</p>
<h2 id="3.-Getting-your-simulation-results-into-Python">3. Getting your simulation results into Python<a class="anchor-link" href="#3.-Getting-your-simulation-results-into-Python">&#194;&#182;</a></h2><p>OMNeT++ result files have their own file format which is not directly
digestible by Python. There are a number of ways to get your data
inside Python:</p>
<ol>
<li><p>Export from the IDE. The Analysis Tool can export data in a number of
formats, the ones that are useful here are CSV and Python-flavoured JSON.
In this tutorial we'll use the CSV export, and read the result into Pandas
using its <code>read_csv()</code> function.</p>
</li>
<li><p>Export using scavetool. Exporting from the IDE may become tedious
after a while, because you have to go through the GUI every time your
simulations are re-run. Luckily, you can automate the exporting with
OMNeT++'s scavetool program. scavetool exposes the same export
functionality as the IDE, and also allows filtering of the data.</p>
</li>
<li><p>Read the OMNeT++ result files directly from Python. Development
of a Python package to read these files into Pandas data frames is
underway, but given that these files are line-oriented text files
with a straightforward and well-documented structure, writing your
own custom reader is also a perfectly feasible option.</p>
</li>
<li><p>SQLite. Since version 5.1, OMNeT++ has the ability to record simulation
results int SQLite3 database files, which can be opened directly from
Python using the <a href="https://docs.python.org/3/library/sqlite3.html">sqlite</a>
package. This lets you use SQL queries to select the input data for your
charts or computations, which is kind of cool! You can even use GUIs like
<a href="http://sqlitebrowser.org/">SQLiteBrowser</a> to browse the database and
craft your SELECT statements. Note: if you configure OMNeT++ for SQLite3
output, you'll still get <code>.vec</code> and <code>.sca</code> files as before, only their
format will change from textual to SQLite's binary format. When querying
the contents of the files, one issue  to deal with is that SQLite does not
allow cross-database queries, so you either need to configure OMNeT++
to record everything into one file (i.e. each run should append instead
of creating a new file), or use scavetool's export functionality to
merge the files into one.</p>
</li>
<li><p>Custom result recording. There is also the option to instrument
the simulation (via C++ code) or OMNeT++ (via custom result recorders)
to produce files that Python can directly digest, e.g. CSV.
However, in the light of the above options, it is rarely necessary
to go this far.</p>
</li>
</ol>
<p>With large-scale simulation studies, it can easily happen that the
full set of simulation results do not fit into the memory at once.
There are also multiple approaches to deal with this problem:</p>
<ol>
<li>If you don't need all simulation results for the analysis, you can
configure OMNeT++ to record only a subset of them. Fine-grained control
is available.</li>
<li>Perform filtering and aggregation steps before analysis. The IDE and
scavetool are both capable of filtering the results before export.</li>
<li>When the above approaches are not enough, it can help to move
part of the result processing (typically, filtering and aggregation)
into the simulation model as dedicated result collection modules.
However, this solution requires significantly more work than the previous
two, so use with care.</li>
</ol>
<p>In this tutorial, we'll work with the contents of the <code>samples/resultfiles</code>
directory distributed with OMNeT++. The directory contains result
files produced by the Aloha and Routing sample simulations, both
of which are parameter studies. We'll start by looking at the Aloha results.</p>
<p>As the first step, we use OMNeT++'s <em>scavetool</em> to convert Aloha's scalar files
to CSV. Run the following commands in the terminal (replace <code>~/omnetpp</code> with 
the location of your OMNeT++ installation):</p>

</div>
</div>
</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">

<pre><code>cd ~/omnetpp/samples/resultfiles/aloha
scavetool x *.sca -o aloha.csv</code></pre>

</div>
</div>
</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>In the scavetool command line, <code>x</code> means export, and the export format is 
inferred from the output file's extension. (Note that scavetool supports 
two different CSV output formats. We need <em>CSV Records</em>, or CSV-R for short, 
which is the default for the <code>.csv</code> extension.)</p>
<p>Let us spend a minute on what the export has created. The CSV file
has a fixed number of columns named <code>run</code>, <code>type</code>, <code>module</code>, <code>name</code>,
<code>value</code>, etc. Each result item, i.e. scalar, statistic, histogram
and vector, produces one row of output in the CSV. Other items such
as run attributes, iteration variables of the parameter study and result
attributes also generate their own rows. The content of the <code>type</code> column
determines what type of information a given row contains. The <code>type</code>
column also determines which other columns are in use. For example,
the <code>binedges</code> and <code>binvalues</code> columns are only filled in for histogram
items. The colums are:</p>
<ul>
<li><em>run</em>: Identifies the simulation run</li>
<li><em>type</em>: Row type, one of the following: <code>scalar</code>, <code>vector</code>, <code>statistics</code>,
<code>histogram</code>, <code>runattr</code>, <code>itervar</code>, <code>param</code>, <code>attr</code></li>
<li><em>module</em>: Hierarchical name (a.k.a. full path) of the module that recorded the
result item</li>
<li><em>name</em>: Name of the result item (scalar, statistic, histogram or vector)</li>
<li><em>attrname</em>: Name of the run attribute or result item attribute (in the latter
case, the <code>module</code> and <code>name</code> columns identify the result item the attribute
belongs to)</li>
<li><em>attrvalue</em>: Value of run and result item attributes, iteration variables,
saved ini param settings (<code>runattr</code>, <code>attr</code>, <code>itervar</code>, <code>param</code>)</li>
<li><em>value</em>: Output scalar value</li>
<li><em>count</em>, <em>sumweights</em>, <em>mean</em>, <em>min</em>, <em>max</em>, <em>stddev</em>: Fields of the statistics 
or histogram</li>
<li><em>binedges</em>, <em>binvalues</em>: Histogram bin edges and bin values, as space-separated
lists. <em>len(binedges)==len(binvalues)+1</em></li>
<li><em>vectime</em>, <em>vecvalue</em>: Output vector time and value arrays, as space-separated
lists</li>
</ul>
<p>When the export is done, you can start Jupyter server with the following command:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">

<pre><code>jupyter notebook</code></pre>

</div>
</div>
</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>Open a web browser with the displayed URL to access the Jupyter GUI. Once there,
choose <em>New</em> -&gt; <em>Python3</em> in the top right corner to open a blank notebook.
The notebook allows you to enter Python commands or sequences of commands,
run them, and view the output. Note that <em>Enter</em> simply inserts a newline;
hit <em>Ctrl+Enter</em> to execute the commands in the current cell, or <em>Alt+Enter</em>
to execute them and also insert a new cell below.</p>
<p>If you cannot use Jupyter for some reason, a terminal-based Python shell 
(<code>python</code> or <code>ipython</code>) will also allow you to follow the tutorial.</p>
<p>On the Python prompt, enter the following lines to make the functionality of
Pandas, NumpPy and Matplotlib available in the session. The last, <code>%matplotlib</code>
line is only needed for Jupyter. (It is a "magic command" that arranges plots
to be displayed within the notebook.)</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[1]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="kn">import</span> <span class="nn">pandas</span> <span class="kn">as</span> <span class="nn">pd</span>
<span class="kn">import</span> <span class="nn">numpy</span> <span class="kn">as</span> <span class="nn">np</span>
<span class="kn">import</span> <span class="nn">matplotlib.pyplot</span> <span class="kn">as</span> <span class="nn">plt</span>
<span class="o">%</span><span class="k">matplotlib</span> inline
</pre></div>

</div>
</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>We utilize the <code>read_csv()</code> function to import the contents of the
CSV file into a data frame. The data frame is the central concept of
Pandas. We will continue to work with this data frame throughout
the whole tutorial.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[2]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">aloha</span> <span class="o">=</span> <span class="n">pd</span><span class="o">.</span><span class="n">read_csv</span><span class="p">(</span><span class="s1">&#39;../aloha/aloha.csv&#39;</span><span class="p">)</span>
</pre></div>

</div>
</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<h2 id="4.-Exploring-the-data-frame">4. Exploring the data frame<a class="anchor-link" href="#4.-Exploring-the-data-frame">&#194;&#182;</a></h2><p>You can view the contents of the data frame by simply entering the name
of the variable (<code>aloha</code>). Alternatively, you can use the <code>head()</code> method
of the data frame to view just the first few lines.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[3]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">aloha</span><span class="o">.</span><span class="n">head</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[3]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">
<div>
<style>
    .dataframe thead tr:only-child th {
        text-align: right;
    }

    .dataframe thead th {
        text-align: left;
    }

    .dataframe tbody tr th {
        vertical-align: top;
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
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
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
    </tr>
    <tr>
      <th>1</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
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
    </tr>
    <tr>
      <th>2</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
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
    </tr>
    <tr>
      <th>3</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
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
    </tr>
    <tr>
      <th>4</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>iterationvars</td>
      <td>numHosts=10, iaMean=2</td>
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

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>You can see that the structure of the data frame, i.e. rows and columns,
directly corresponds to the contents of the CSV file. Column names have
been taken from the first line of the CSV file. Missing values are
represented with NaNs (not-a-number).</p>
<p>The complementary <code>tail()</code> method shows the last few lines. There is also
an <code>iloc</code> method that we use at places in this tutorial to show rows
from the middle of the data frame. It accepts a range: <code>aloha.iloc[20:30]</code>
selects 10 lines from line 20, <code>aloha.iloc[:5]</code> is like <code>head()</code>, and
<code>aloha.iloc[-5:]</code> is like <code>tail()</code>.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[4]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">aloha</span><span class="o">.</span><span class="n">iloc</span><span class="p">[</span><span class="mi">1200</span><span class="p">:</span><span class="mi">1205</span><span class="p">]</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[4]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">
<div>
<style>
    .dataframe thead tr:only-child th {
        text-align: right;
    }

    .dataframe thead th {
        text-align: left;
    }

    .dataframe tbody tr th {
        vertical-align: top;
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
    </tr>
  </tbody>
</table>
</div>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>Hint: If you are in the terminal and you find that the data frame printout does
not make use of the whole width of the terminal, you can increase the display 
width for better readability with the following commands:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[5]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">pd</span><span class="o">.</span><span class="n">set_option</span><span class="p">(</span><span class="s1">&#39;display.width&#39;</span><span class="p">,</span> <span class="mi">180</span><span class="p">)</span>
<span class="n">pd</span><span class="o">.</span><span class="n">set_option</span><span class="p">(</span><span class="s1">&#39;display.max_colwidth&#39;</span><span class="p">,</span> <span class="mi">100</span><span class="p">)</span>
</pre></div>

</div>
</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>If you have not looked at any Pandas tutorial yet, now is a very good
time to read one. (See References at the bottom of this page for hints.)
Until you finish, here are some basics for your short-term survival.</p>
<p>You can refer to a column as a whole with the array index syntax: <code>aloha['run']</code>.
Alternatively, the more convenient member access syntax (<code>aloha.run</code>) can
also be used, with restrictions. (E.g. the column name must be valid as a Python
identifier, and should not collide with existing methods of the data frame.
Names that are known to cause trouble include <code>name</code>, <code>min</code>, <code>max</code>, <code>mean</code>).</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[6]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">aloha</span><span class="o">.</span><span class="n">run</span><span class="o">.</span><span class="n">head</span><span class="p">()</span>  <span class="c1"># .head() is for limiting the output to 5 lines here</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[6]:</div>




<div class="output_text output_subarea output_execute_result">
<pre>0    PureAlohaExperiment-3-20170627-20:42:20-22739
1    PureAlohaExperiment-3-20170627-20:42:20-22739
2    PureAlohaExperiment-3-20170627-20:42:20-22739
3    PureAlohaExperiment-3-20170627-20:42:20-22739
4    PureAlohaExperiment-3-20170627-20:42:20-22739
Name: run, dtype: object</pre>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>Selecting multiple columns is also possible, one just needs to use a list of
column names as index. The result will be another data frame. (The double
brackets in the command are due to the fact that both the array indexing and 
the list syntax use square brackets.)</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[7]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">tmp</span> <span class="o">=</span> <span class="n">aloha</span><span class="p">[[</span><span class="s1">&#39;run&#39;</span><span class="p">,</span> <span class="s1">&#39;attrname&#39;</span><span class="p">,</span> <span class="s1">&#39;attrvalue&#39;</span><span class="p">]]</span>
<span class="n">tmp</span><span class="o">.</span><span class="n">head</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[7]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">
<div>
<style>
    .dataframe thead tr:only-child th {
        text-align: right;
    }

    .dataframe thead th {
        text-align: left;
    }

    .dataframe tbody tr th {
        vertical-align: top;
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
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
      <td>configname</td>
      <td>PureAlohaExperiment</td>
    </tr>
    <tr>
      <th>1</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
      <td>datetime</td>
      <td>20170627-20:42:20</td>
    </tr>
    <tr>
      <th>2</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
      <td>experiment</td>
      <td>PureAlohaExperiment</td>
    </tr>
    <tr>
      <th>3</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
      <td>inifile</td>
      <td>omnetpp.ini</td>
    </tr>
    <tr>
      <th>4</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
      <td>iterationvars</td>
      <td>numHosts=10, iaMean=2</td>
    </tr>
  </tbody>
</table>
</div>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>The <code>describe()</code> method can be used to get an idea about the contents of a 
column. When applied to a non-numeric column, it prints the number of 
non-null elements in it (<code>count</code>), the number of unique values (<code>unique</code>),
the most frequently occurring value (<code>top</code>) and its multiplicity (<code>freq</code>),
and the inferred data type (more about that later.)</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[8]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">aloha</span><span class="o">.</span><span class="n">module</span><span class="o">.</span><span class="n">describe</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[8]:</div>




<div class="output_text output_subarea output_execute_result">
<pre>count              924
unique               1
top       Aloha.server
freq               924
Name: module, dtype: object</pre>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>You can get a list of the unique values using the <code>unique()</code> method. For example,
the following command lists the names of modules that have recorded any statistics:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[9]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">aloha</span><span class="o">.</span><span class="n">module</span><span class="o">.</span><span class="n">unique</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[9]:</div>




<div class="output_text output_subarea output_execute_result">
<pre>array([nan, &#39;Aloha.server&#39;], dtype=object)</pre>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>When you apply <code>describe()</code> to a numeric column, you get a statistical summary
with things like mean, standard deviation, minimum, maximum, and various 
quantiles.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[10]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">aloha</span><span class="o">.</span><span class="n">value</span><span class="o">.</span><span class="n">describe</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[10]:</div>




<div class="output_text output_subarea output_execute_result">
<pre>count      294.000000
mean      4900.038749
std      11284.077075
min          0.045582
25%          0.192537
50%        668.925298
75%       5400.000000
max      95630.000000
Name: value, dtype: float64</pre>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>Applying <code>describe()</code> to the whole data frame creates a similar report about
all numeric columns.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[11]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">aloha</span><span class="o">.</span><span class="n">describe</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[11]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">
<div>
<style>
    .dataframe thead tr:only-child th {
        text-align: right;
    }

    .dataframe thead th {
        text-align: left;
    }

    .dataframe tbody tr th {
        vertical-align: top;
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

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>Let's spend a minute on data types and column data types. Every column has a
data type (abbreviated <em>dtype</em>) that determines what type of values it may
contain. Column dtypes can be printed with <code>dtypes</code>:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[12]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">aloha</span><span class="o">.</span><span class="n">dtypes</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[12]:</div>




<div class="output_text output_subarea output_execute_result">
<pre>run            object
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
dtype: object</pre>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>The two most commonly used dtypes are <em>float64</em> and <em>object</em>. A <em>float64</em> column
contains floating-point numbers, and missing values are represented with NaNs. 
An <em>object</em> column may contain basically anything -- usually strings, but we'll
also have NumPy arrays (<code>np.ndarray</code>) as elements in this tutorial. 
Numeric values and booleans may also occur in an <em>object</em> column. Missing values
in an <em>object</em> column are usually represented with <code>None</code>, but Pandas also
interprets the floating-point NaN like that.
Some degree of confusion arises from fact that some Pandas functions check 
the column's dtype, while others are already happy if the contained elements
are of the required type. To clarify: applying <code>describe()</code> to a column 
prints a type inferred from the individual elements, <em>not</em> the column dtype.
The column dtype type can be changed with the <code>astype()</code> method; we'll see an
example for using it later in this tutorial.</p>
<p>The column dtype can be accessed as the <code>dtype</code> property of a column, for example
<code>aloha.stddev.dtype</code> yields <code>dtype('float64')</code>. There are also convenience
functions such as <code>is_numeric_dtype()</code> and <code>is_string_dtype()</code> for checking 
column dtype. (They need to be imported from the <code>pandas.api.types</code> package
though.)</p>
<p>Another vital thing to know, especially due of the existence of the <em>type</em>
column in the OMNeT++ CSV format, is how to filter rows. Perhaps surprisingly, 
the array index syntax can be used here as well. For example, the following expression 
selects the rows that contain iteration variables: <code>aloha[aloha.type == 'itervar']</code>. 
With a healthy degree of sloppiness, here's how it works: <code>aloha.type</code> yields 
the values in the <code>type</code> column as an array-like data structure; 
<code>aloha.type=='itervar'</code> performs element-wise comparison and produces an array
of booleans containing <code>True</code> where the condition holds and <code>False</code> where not;
and indexing a data frame with an array of booleans returns the rows that 
correspond to <code>True</code> values in the array.</p>
<p>Conditions can be combined with AND/OR using the "<code>&amp;</code>" and "<code>|</code>" operators, but
you need parentheses because of operator precedence. The following command
selects the rows that contain scalars with a certain name and owner module:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[13]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">tmp</span> <span class="o">=</span> <span class="n">aloha</span><span class="p">[(</span><span class="n">aloha</span><span class="o">.</span><span class="n">type</span><span class="o">==</span><span class="s1">&#39;scalar&#39;</span><span class="p">)</span> <span class="o">&amp;</span> <span class="p">(</span><span class="n">aloha</span><span class="o">.</span><span class="n">module</span><span class="o">==</span><span class="s1">&#39;Aloha.server&#39;</span><span class="p">)</span> <span class="o">&amp;</span> <span class="p">(</span><span class="n">aloha</span><span class="o">.</span><span class="n">name</span><span class="o">==</span><span class="s1">&#39;channelUtilization:last&#39;</span><span class="p">)]</span>
<span class="n">tmp</span><span class="o">.</span><span class="n">head</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[13]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">
<div>
<style>
    .dataframe thead tr:only-child th {
        text-align: right;
    }

    .dataframe thead th {
        text-align: left;
    }

    .dataframe tbody tr th {
        vertical-align: top;
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
    </tr>
  </tbody>
</table>
</div>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>You'll also need to know how to add a new column to the data frame. Now that is
a bit controversial topic, because at the time of writing, there is a "convenient"
syntax and an "official" syntax for it. The "convenient" syntax is a simple
assignment, for example:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[14]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">aloha</span><span class="p">[</span><span class="s1">&#39;qname&#39;</span><span class="p">]</span> <span class="o">=</span> <span class="n">aloha</span><span class="o">.</span><span class="n">module</span> <span class="o">+</span> <span class="s2">&quot;.&quot;</span> <span class="o">+</span> <span class="n">aloha</span><span class="o">.</span><span class="n">name</span>
<span class="n">aloha</span><span class="p">[</span><span class="n">aloha</span><span class="o">.</span><span class="n">type</span><span class="o">==</span><span class="s1">&#39;scalar&#39;</span><span class="p">]</span><span class="o">.</span><span class="n">head</span><span class="p">()</span>  <span class="c1"># print excerpt</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[14]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">
<div>
<style>
    .dataframe thead tr:only-child th {
        text-align: right;
    }

    .dataframe thead th {
        text-align: left;
    }

    .dataframe tbody tr th {
        vertical-align: top;
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
      <td>Aloha.server.collidedFrames:last</td>
    </tr>
  </tbody>
</table>
</div>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>It looks nice and natural, but it is not entirely correct. It often results in 
a warning: <em>SettingWithCopyWarning: A value is trying to be set on a copy of a 
slice from a DataFrame...</em>. The message essentially says that the operation
(here, adding the new column) might have been applied to a temporary object 
instead of the original data frame, and thus might have been ineffective. 
Luckily, that is not the case most of the time (the operation <em>does</em> take 
effect). Nevertheless, for production code, i.e. scripts, the "official" 
solution, the <code>assign()</code> method of the data frame is recommended, like this:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[15]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">aloha</span> <span class="o">=</span> <span class="n">aloha</span><span class="o">.</span><span class="n">assign</span><span class="p">(</span><span class="n">qname</span> <span class="o">=</span> <span class="n">aloha</span><span class="o">.</span><span class="n">module</span> <span class="o">+</span> <span class="s2">&quot;.&quot;</span> <span class="o">+</span> <span class="n">aloha</span><span class="o">.</span><span class="n">name</span><span class="p">)</span>
<span class="n">aloha</span><span class="p">[</span><span class="n">aloha</span><span class="o">.</span><span class="n">type</span><span class="o">==</span><span class="s1">&#39;scalar&#39;</span><span class="p">]</span><span class="o">.</span><span class="n">head</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[15]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">
<div>
<style>
    .dataframe thead tr:only-child th {
        text-align: right;
    }

    .dataframe thead th {
        text-align: left;
    }

    .dataframe tbody tr th {
        vertical-align: top;
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
      <td>Aloha.server.collidedFrames:last</td>
    </tr>
  </tbody>
</table>
</div>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>For completeness, one can remove a column from a data frame using either the
<code>del</code> operator or the <code>drop()</code> method of the data frame. Here we show the former
(also to remove the column we added above, as we won't need it for now):</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[16]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="k">del</span> <span class="n">aloha</span><span class="p">[</span><span class="s1">&#39;qname&#39;</span><span class="p">]</span>
</pre></div>

</div>
</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<h2 id="5.-Revisiting-CSV-loading">5. Revisiting CSV loading<a class="anchor-link" href="#5.-Revisiting-CSV-loading">&#194;&#182;</a></h2><p>The way we have read the CSV file has one small deficiency: all data in the
<code>attrvalue</code> column are represented as strings, event though many of them
are really numbers, for example the values of the <code>iaMean</code> and <code>numHosts</code>
iteration variables. You can verify that by printing the unique values (
<code>aloha.attrvalue.unique()</code> -- it will print all values with quotes), or using 
the <code>type()</code> operator on an element:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[17]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="nb">type</span><span class="p">(</span> <span class="n">aloha</span><span class="p">[</span><span class="n">aloha</span><span class="o">.</span><span class="n">type</span><span class="o">==</span><span class="s1">&#39;scalar&#39;</span><span class="p">]</span><span class="o">.</span><span class="n">iloc</span><span class="p">[</span><span class="mi">0</span><span class="p">]</span><span class="o">.</span><span class="n">value</span> <span class="p">)</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[17]:</div>




<div class="output_text output_subarea output_execute_result">
<pre>numpy.float64</pre>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>The reason is that <code>read_csv()</code> infers data types of columns from the data
it finds in them. Since the <code>attrvalue</code> column is shared by run attributes, 
result item attributes, iteration variables and some other types of rows,
there are many non-numeric strings in it, and <code>read_csv()</code> decides that it is
a string column.</p>
<p>A similar issue arises with the <code>binedges</code>, <code>binvalues</code>, <code>vectime</code>, <code>vecvalue</code>
columns. These columns contain lists of numbers separated by spaces, so they
are read into strings as well. However, we would like to store them as NumPy
arrays (<code>ndarray</code>) inside the data frame, because that's the form we can use
in plots or as computation input.</p>
<p>Luckily, <code>read_csv()</code> allows us to specify conversion functions for each column.
So, armed with the following two short functions:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[18]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="k">def</span> <span class="nf">parse_if_number</span><span class="p">(</span><span class="n">s</span><span class="p">):</span>
    <span class="k">try</span><span class="p">:</span> <span class="k">return</span> <span class="nb">float</span><span class="p">(</span><span class="n">s</span><span class="p">)</span>
    <span class="k">except</span><span class="p">:</span> <span class="k">return</span> <span class="bp">True</span> <span class="k">if</span> <span class="n">s</span><span class="o">==</span><span class="s2">&quot;true&quot;</span> <span class="k">else</span> <span class="bp">False</span> <span class="k">if</span> <span class="n">s</span><span class="o">==</span><span class="s2">&quot;false&quot;</span> <span class="k">else</span> <span class="n">s</span> <span class="k">if</span> <span class="n">s</span> <span class="k">else</span> <span class="bp">None</span>

<span class="k">def</span> <span class="nf">parse_ndarray</span><span class="p">(</span><span class="n">s</span><span class="p">):</span>
    <span class="k">return</span> <span class="n">np</span><span class="o">.</span><span class="n">fromstring</span><span class="p">(</span><span class="n">s</span><span class="p">,</span> <span class="n">sep</span><span class="o">=</span><span class="s1">&#39; &#39;</span><span class="p">)</span> <span class="k">if</span> <span class="n">s</span> <span class="k">else</span> <span class="bp">None</span>
</pre></div>

</div>
</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>we can read the CSV file again, this time with the correct conversions:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[19]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">aloha</span> <span class="o">=</span> <span class="n">pd</span><span class="o">.</span><span class="n">read_csv</span><span class="p">(</span><span class="s1">&#39;../aloha/aloha.csv&#39;</span><span class="p">,</span> <span class="n">converters</span> <span class="o">=</span> <span class="p">{</span>
    <span class="s1">&#39;attrvalue&#39;</span><span class="p">:</span> <span class="n">parse_if_number</span><span class="p">,</span>
    <span class="s1">&#39;binedges&#39;</span><span class="p">:</span> <span class="n">parse_ndarray</span><span class="p">,</span>
    <span class="s1">&#39;binvalues&#39;</span><span class="p">:</span> <span class="n">parse_ndarray</span><span class="p">,</span>
    <span class="s1">&#39;vectime&#39;</span><span class="p">:</span> <span class="n">parse_ndarray</span><span class="p">,</span>
    <span class="s1">&#39;vecvalue&#39;</span><span class="p">:</span> <span class="n">parse_ndarray</span><span class="p">})</span>
</pre></div>

</div>
</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>You can verify the result e.g. by printing the unique values again.</p>
<h2 id="6.-Load-time-filtering">6. Load-time filtering<a class="anchor-link" href="#6.-Load-time-filtering">&#194;&#182;</a></h2><p>If the CSV file is large, you may want to skip certain columns or rows when
reading it into memory. (File size is about the only valid reason for using
load-time filtering, because you can also filter out or drop rows/columns
from the data frame when it is already loaded.)</p>
<p>To filter out columns, you need to specify in the <code>usecols</code> parameter
the list of columns to keep:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[20]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">tmp</span> <span class="o">=</span> <span class="n">pd</span><span class="o">.</span><span class="n">read_csv</span><span class="p">(</span><span class="s1">&#39;../aloha/aloha.csv&#39;</span><span class="p">,</span> <span class="n">usecols</span><span class="o">=</span><span class="p">[</span><span class="s1">&#39;run&#39;</span><span class="p">,</span> <span class="s1">&#39;type&#39;</span><span class="p">,</span> <span class="s1">&#39;module&#39;</span><span class="p">,</span> <span class="s1">&#39;name&#39;</span><span class="p">,</span> <span class="s1">&#39;value&#39;</span><span class="p">])</span>
</pre></div>

</div>
</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>There is no such direct support for filtering out rows based on their content,
but we can implement it using the iterator API that reads the CSV file 
in chunks. We can filter each chunk before storing and finally concatenating 
them into a single data frame:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[21]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="nb">iter</span> <span class="o">=</span> <span class="n">pd</span><span class="o">.</span><span class="n">read_csv</span><span class="p">(</span><span class="s1">&#39;../aloha/aloha.csv&#39;</span><span class="p">,</span> <span class="n">iterator</span><span class="o">=</span><span class="bp">True</span><span class="p">,</span> <span class="n">chunksize</span><span class="o">=</span><span class="mi">100</span><span class="p">)</span>
<span class="n">chunks</span> <span class="o">=</span> <span class="p">[</span> <span class="n">chunk</span><span class="p">[</span><span class="n">chunk</span><span class="p">[</span><span class="s1">&#39;type&#39;</span><span class="p">]</span><span class="o">!=</span><span class="s1">&#39;histogram&#39;</span><span class="p">]</span> <span class="k">for</span> <span class="n">chunk</span> <span class="ow">in</span> <span class="nb">iter</span> <span class="p">]</span>  <span class="c1"># discards type==&#39;histogram&#39; lines</span>
<span class="n">tmp</span> <span class="o">=</span> <span class="n">pd</span><span class="o">.</span><span class="n">concat</span><span class="p">(</span><span class="n">chunks</span><span class="p">)</span>
</pre></div>

</div>
</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<h2 id="7.-Plotting-scalars">7. Plotting scalars<a class="anchor-link" href="#7.-Plotting-scalars">&#194;&#182;</a></h2><p>Scalars can serve as input for many different kinds of plots. Here we'll show
how one can create a "throughput versus offered load" type plot. We will plot
the channel utilization in the Aloha model in the function of the packet 
generation frequency. Channel utilization is also affected by the number of 
hosts in the network -- we want results belonging to the same number of hosts
to form iso lines. Packet generation frequency and the number of hosts are
present in the results as iteration variables named <code>iaMean</code> and <code>numHosts</code>;
channel utilization values are the <code>channelUtilization:last</code> scalars saved 
by the <code>Aloha.server</code> module. The data contains the results from two simulation
runs for each <em>(iaMean, numHosts)</em> pair done with different seeds; we want
to average them for the plot.</p>
<p>The first few steps are fairly straightforward. We only need the scalars and the
iteration variables from the data frame, so we filter out the rest. Then we
create a <code>qname</code> column from other columns to hold the names of our variables:
the names of scalars are in the <code>module</code> and <code>name</code> columns (we want to join them
with a dot), and the names of iteration variables are in the <code>attrname</code> column.
Since <code>attrname</code> is not filled in for scalar rows, we can take <code>attrname</code> as<code>qname</code>
first, then fill in the holes with <em>module.name</em>. We use the <code>combine_first()</code>
method for that: <code>a.combine_first(b)</code> fills the holes in <code>a</code> using the 
corresponding values from <code>b</code>.</p>
<p>The similar issue arises with values: values of output scalars are in the <code>value</code> 
column, while that of iteration variables are in the <code>attrvalue</code> column.
Since <code>attrvalue</code> is unfilled for scalar rows, we can again utilize 
<code>combine_first()</code> to merge two. There is one more catch: we need to change 
the dtype of the <code>attrvalue</code> to <code>float64</code>, otherwise the resulting <code>value</code>
column also becomes <code>object</code> dtype. (Luckily, all our iteration variables are 
numeric, so the dtype conversion is possible. In other simulations that contain
non-numeric itervars, one needs to filter those out, force them into numeric
values somehow, or find some other trick to make things work.)</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[22]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">scalars</span> <span class="o">=</span> <span class="n">aloha</span><span class="p">[(</span><span class="n">aloha</span><span class="o">.</span><span class="n">type</span><span class="o">==</span><span class="s1">&#39;scalar&#39;</span><span class="p">)</span> <span class="o">|</span> <span class="p">(</span><span class="n">aloha</span><span class="o">.</span><span class="n">type</span><span class="o">==</span><span class="s1">&#39;itervar&#39;</span><span class="p">)]</span>  <span class="c1"># filter rows</span>
<span class="n">scalars</span> <span class="o">=</span> <span class="n">scalars</span><span class="o">.</span><span class="n">assign</span><span class="p">(</span><span class="n">qname</span> <span class="o">=</span> <span class="n">scalars</span><span class="o">.</span><span class="n">attrname</span><span class="o">.</span><span class="n">combine_first</span><span class="p">(</span><span class="n">scalars</span><span class="o">.</span><span class="n">module</span> <span class="o">+</span> <span class="s1">&#39;.&#39;</span> <span class="o">+</span> <span class="n">scalars</span><span class="o">.</span><span class="n">name</span><span class="p">))</span>  <span class="c1"># add qname column </span>
<span class="n">scalars</span><span class="o">.</span><span class="n">value</span> <span class="o">=</span> <span class="n">scalars</span><span class="o">.</span><span class="n">value</span><span class="o">.</span><span class="n">combine_first</span><span class="p">(</span><span class="n">scalars</span><span class="o">.</span><span class="n">attrvalue</span><span class="o">.</span><span class="n">astype</span><span class="p">(</span><span class="s1">&#39;float64&#39;</span><span class="p">))</span>  <span class="c1"># merge value columns</span>
<span class="n">scalars</span><span class="p">[[</span><span class="s1">&#39;run&#39;</span><span class="p">,</span> <span class="s1">&#39;type&#39;</span><span class="p">,</span> <span class="s1">&#39;qname&#39;</span><span class="p">,</span> <span class="s1">&#39;value&#39;</span><span class="p">,</span> <span class="s1">&#39;module&#39;</span><span class="p">,</span> <span class="s1">&#39;name&#39;</span><span class="p">,</span> <span class="s1">&#39;attrname&#39;</span><span class="p">]]</span><span class="o">.</span><span class="n">iloc</span><span class="p">[</span><span class="mi">80</span><span class="p">:</span><span class="mi">90</span><span class="p">]</span>  <span class="c1"># print an excerpt of the result</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[22]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">
<div>
<style>
    .dataframe thead tr:only-child th {
        text-align: right;
    }

    .dataframe thead th {
        text-align: left;
    }

    .dataframe tbody tr th {
        vertical-align: top;
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

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>To work further, it would be very convenient if we had a format where each
simulation run corresponds to one row, and all variables produced by that
run had their own columns. We can call it the <em>wide</em> format, and it can be
produced using the <code>pivot()</code> method:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[23]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">scalars_wide</span> <span class="o">=</span> <span class="n">scalars</span><span class="o">.</span><span class="n">pivot</span><span class="p">(</span><span class="s1">&#39;run&#39;</span><span class="p">,</span> <span class="n">columns</span><span class="o">=</span><span class="s1">&#39;qname&#39;</span><span class="p">,</span> <span class="n">values</span><span class="o">=</span><span class="s1">&#39;value&#39;</span><span class="p">)</span>
<span class="n">scalars_wide</span><span class="o">.</span><span class="n">head</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[23]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">
<div>
<style>
    .dataframe thead tr:only-child th {
        text-align: right;
    }

    .dataframe thead th {
        text-align: left;
    }

    .dataframe tbody tr th {
        vertical-align: top;
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

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>We are interested in only three columns for our plot:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[24]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">scalars_wide</span><span class="p">[[</span><span class="s1">&#39;numHosts&#39;</span><span class="p">,</span> <span class="s1">&#39;iaMean&#39;</span><span class="p">,</span> <span class="s1">&#39;Aloha.server.channelUtilization:last&#39;</span><span class="p">]]</span><span class="o">.</span><span class="n">head</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[24]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">
<div>
<style>
    .dataframe thead tr:only-child th {
        text-align: right;
    }

    .dataframe thead th {
        text-align: left;
    }

    .dataframe tbody tr th {
        vertical-align: top;
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

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>Since we have our <em>x</em> and <em>y</em> data in separate columns now, we can utilize the
scatter plot feature of the data frame for plotting it:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[25]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">scalars_wide</span><span class="o">.</span><span class="n">plot</span><span class="o">.</span><span class="n">scatter</span><span class="p">(</span><span class="s1">&#39;iaMean&#39;</span><span class="p">,</span> <span class="s1">&#39;Aloha.server.channelUtilization:last&#39;</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">show</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt"></div>




<div class="output_png output_subarea ">
<img src="data:image/png;base64,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
AElFTkSuQmCC
"
>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>NOTE: Although <code>plt.show()</code> is not needed in Jupyter (<code>%matplotlib inline</code>
turns on immediate display), we'll continue to include it in further code
fragments, so that they work without change when you use another Python shell.</p>
<p>The resulting chart looks quite good as the first attempt. However, it has some 
shortcomings:</p>
<ul>
<li>Dots are not connected. The dots that have the same <code>numHosts</code> value should
be connected with iso lines.</li>
<li>As the result of having two simulation runs for each <em>(iaMean,numHosts)</em> pair,
the dots appear in pairs. We'd like to see their averages instead.</li>
</ul>
<p>Unfortunately, scatter plot can only take us this far, we need to look for 
another way.</p>
<p>What we really need as chart input is a table where rows correspond to different
<code>iaMean</code> values, columns correspond to different <code>numHosts</code> values, and cells
contain channel utilization values (the average of the repetitions). 
Such table can be produced from the "wide format" with another pivoting
operation. We use <code>pivot_table()</code>, a cousin of the <code>pivot()</code> method we've seen above.
The difference between them is that <code>pivot()</code> is a reshaping operation (it just
rearranges elements), while <code>pivot_table()</code> is more of a spreadsheet-style 
pivot table creation operation, and primarily intended for numerical data. 
<code>pivot_table()</code> accepts an aggregation function with the default being <em>mean</em>,
which is quite convenient for us now (we want to average channel utilization
over repetitions.)</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[26]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">aloha_pivot</span> <span class="o">=</span> <span class="n">scalars_wide</span><span class="o">.</span><span class="n">pivot_table</span><span class="p">(</span><span class="n">index</span><span class="o">=</span><span class="s1">&#39;iaMean&#39;</span><span class="p">,</span> <span class="n">columns</span><span class="o">=</span><span class="s1">&#39;numHosts&#39;</span><span class="p">,</span> <span class="n">values</span><span class="o">=</span><span class="s1">&#39;Aloha.server.channelUtilization:last&#39;</span><span class="p">)</span>  <span class="c1"># note: aggregation function = mean (that&#39;s the default)</span>
<span class="n">aloha_pivot</span><span class="o">.</span><span class="n">head</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[26]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">
<div>
<style>
    .dataframe thead tr:only-child th {
        text-align: right;
    }

    .dataframe thead th {
        text-align: left;
    }

    .dataframe tbody tr th {
        vertical-align: top;
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

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>Note that rows correspond to various <code>iaMean</code> values (<code>iaMean</code> serves as index);
there is one column for each value of <code>numHosts</code>; and that data in the table
are the averages of the channel utilizations produced by the simulations 
performed with the respective <code>iaMean</code> and <code>numHosts</code> values.</p>
<p>For the plot, every column should generate a separate line (with the <em>x</em> values
coming from the index column, <code>iaMean</code>) labelled with the column name.
The basic Matplotlib interface cannot create such plot in one step. However,
the Pandas data frame itself has a plotting interface which knows how to
interpret the data, and produces the correct plot without much convincing:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[27]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">aloha_pivot</span><span class="o">.</span><span class="n">plot</span><span class="o">.</span><span class="n">line</span><span class="p">()</span>
<span class="n">plt</span><span class="o">.</span><span class="n">ylabel</span><span class="p">(</span><span class="s1">&#39;channel utilization&#39;</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">show</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt"></div>




<div class="output_png output_subarea ">
<img src="data:image/png;base64,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
V5Jz5gDd7a87AUvtrxcCVZVS2ZVSWYEmwK57XjEsDGrUMArCYDAYLMCt5iYRiVdKvQEs4nYI7G6l
1CBgg4jMBcYBvyul9gHn0YoEEbmklBoBbARswDwRWXDPi5qoJoPBYLCMjNXjWgRKlICFC6FSJc8K
ZvAYxqySPOZ7MSTGW8xNacuOHZAtG1RMmophMBgMBlfIWEoiwdTkQFcvg8ET3Lx5k5deeomSJUuS
J08eAgIC7igFvmTJEipVqkSuXLlo1qwZR44cSXEu0770/9u7/yCryjqO4++PKMiKmkZqZKyF7JA0
rLqaTCZBopkOkmni5o7ZODlYjY5/2Dg2k4g6jf2yRvMPJyV0RB0JJkrNX2hKTf5ef6wy7UCBKAIL
SQiFrnz74zyLl+UeFpS759z185rZufee+9yz3z1z737veZ7nfB/rDwMzSZiVVHd3NyNHjuSJJ55g
/fr1XH311Zx99tksX76ctWvXcuaZZ3Lttdeybt06WlpamDZtWu6+WltbaWlpYd26dVxzzTWcddZZ
uYsUmX1QA2dMYs0aOPxwWL0ahgwpOiwrUL31vTc3NzNjxgy6urqYPXs2ixYtAmDTpk0MHz6c9vZ2
mpqatnlNZ2cn48aNo6ura+taExMmTKCtrY0LL7yw6u+pt+NitfXRG5O4/36YPNkJwurKqlWr6Ozs
ZOzYsXR0dNDc3Lz1uYaGBkaNGlV1SVIvX2r9ZeAkCXc12c6Sds/Ph9Td3U1bWxvnn38+TU1NuUuS
btiwYbvX7kpbsw9jYCSJd96Bhx6CU08tOhKrBxG75+dDhRC0tbUxZMgQbrjhBmDXliT18qXWXwZG
kli0CJqa4OCDi47EbKdccMEFdHV1MW/ePAYNGgRkS5K2t7dvbbNx40aWLFlSdUlSL19q/WVgJAl3
NVkdmT59OosXL2bBggUMHjx46/YzzjiDjo4O5s+fz+bNm5k5cybNzc3bDVqDly+1fhQRdf0DRIwe
HfHcc2EWEZG9rctp2bJlISmGDh0aw4YNi2HDhsW+++4bc+bMiYiIRx55JMaMGRMNDQ0xadKkWLZs
2dbXTp8+PS666KJt9jVx4sQYOnRojBkzJhYuXLjD313m42L9L70f+vwfOzCmwI4YAStW+CI6AzzV
M4+Pi1X6aE2B9VXWZmY1MTCSxJQpRUdgZjYgDYzupo0boaGh6FCsJNytUp2Pi1X6aHU3OUGYmdXE
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
"
>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<h2 id="8.-Interactive-pivot-tables">8. Interactive pivot tables<a class="anchor-link" href="#8.-Interactive-pivot-tables">&#194;&#182;</a></h2><p>Getting the pivot table right is not always easy, so having a GUI where 
one can drag columns around and immediately see the result is definitely 
a blessing. Pivottable.js presents such a GUI inside a browser, and 
although the bulk of the code is Javascript, it has a Python frond-end 
that integrates nicely with Jupyter. Let's try it!</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[28]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="kn">import</span> <span class="nn">pivottablejs</span> <span class="kn">as</span> <span class="nn">pj</span>
<span class="n">pj</span><span class="o">.</span><span class="n">pivot_ui</span><span class="p">(</span><span class="n">scalars_wide</span><span class="p">)</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[28]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">

        <iframe
            width="100%"
            height="500"
            src="pivottablejs.html"
            frameborder="0"
            allowfullscreen
        ></iframe>
        
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>An interactive panel containing the pivot table will appear. Here is how
you can reproduce the above "Channel utilization vs iaMean" plot in it:</p>
<ol>
<li>Drag <code>numHosts</code> to the "rows" area of the pivot table.
The table itself is the area on the left that initially only displays "Totals | 42", 
and the "rows" area is the empty rectangle directly of left it. 
The table should show have two columns (<em>numHosts</em> and <em>Totals</em>) and 
five rows in total after dragging.</li>
<li>Drag <code>iaMean</code> to the "columns" area (above the table). Columns for each value
of <code>iaMean</code> should appear in the table.</li>
<li>Near the top-left corner of the table, select <em>Average</em> from the combo box
that originally displays <em>Count</em>, and select <code>ChannelUtilization:last</code> 
from the combo box that appears below it.</li>
<li>In the top-left corner of the panel, select <em>Line Chart</em> from the combo box
that originally displays <em>Table</em>.</li>
</ol>
<p>If you can't get to see it, the following command will programmatically
configure the pivot table in the appropriate way:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[29]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">pj</span><span class="o">.</span><span class="n">pivot_ui</span><span class="p">(</span><span class="n">scalars_wide</span><span class="p">,</span> <span class="n">rows</span><span class="o">=</span><span class="p">[</span><span class="s1">&#39;numHosts&#39;</span><span class="p">],</span> <span class="n">cols</span><span class="o">=</span><span class="p">[</span><span class="s1">&#39;iaMean&#39;</span><span class="p">],</span> <span class="n">vals</span><span class="o">=</span><span class="p">[</span><span class="s1">&#39;Aloha.server.channelUtilization:last&#39;</span><span class="p">],</span> <span class="n">aggregatorName</span><span class="o">=</span><span class="s1">&#39;Average&#39;</span><span class="p">,</span> <span class="n">rendererName</span><span class="o">=</span><span class="s1">&#39;Line Chart&#39;</span><span class="p">)</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[29]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">

        <iframe
            width="100%"
            height="500"
            src="pivottablejs.html"
            frameborder="0"
            allowfullscreen
        ></iframe>
        
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>If you want experiment with Excel's or LibreOffice's built-in pivot table 
functionality, the data frame's <code>to_clipboard()</code> and <code>to_csv()</code> methods
will help you transfer the data. For example, you can issue the 
<code>scalars_wide.to_clipboard()</code> command to put the data on the clipboard, then 
paste it into the spreadsheet. Alternatively, type <code>print(scalars_wide.to_csv())</code>
to print the data in CSV format that you can select and then copy/paste.
Or, use <code>scalars_wide.to_csv("scalars.csv")</code> to save the data into a file
which you can import.</p>
<h2 id="9.-Plotting-histograms">9. Plotting histograms<a class="anchor-link" href="#9.-Plotting-histograms">&#194;&#182;</a></h2><p>In this section we explore how to plot histograms recorded by the simulation.
Histograms are in rows that have <code>"histogram"</code> in the <code>type</code> column. 
Histogram bin edges and bin values (counts) are in the <code>binedges</code> and 
<code>binvalues</code> columns as NumPy array objects (<code>ndarray</code>).</p>
<p>Let us begin by selecting the histograms into a new data frame for convenience.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[30]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">histograms</span> <span class="o">=</span> <span class="n">aloha</span><span class="p">[</span><span class="n">aloha</span><span class="o">.</span><span class="n">type</span><span class="o">==</span><span class="s1">&#39;histogram&#39;</span><span class="p">]</span>
<span class="nb">len</span><span class="p">(</span><span class="n">histograms</span><span class="p">)</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[30]:</div>




<div class="output_text output_subarea output_execute_result">
<pre>84</pre>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>We have 84 histograms. It makes no sense to plot so many histograms on one chart,
so let's just take one on them, and examine its content.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[31]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">hist</span> <span class="o">=</span> <span class="n">histograms</span><span class="o">.</span><span class="n">iloc</span><span class="p">[</span><span class="mi">0</span><span class="p">]</span>  <span class="c1"># the first histogram</span>
<span class="n">hist</span><span class="o">.</span><span class="n">binedges</span><span class="p">,</span> <span class="n">hist</span><span class="o">.</span><span class="n">binvalues</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[31]:</div>




<div class="output_text output_subarea output_execute_result">
<pre>(array([-0.11602833, -0.08732314, -0.05861794, -0.02991275, -0.00120756,
         0.02749763,  0.05620283,  0.08490802,  0.11361321,  0.1423184 ,
         0.1710236 ,  0.19972879,  0.22843398,  0.25713917,  0.28584437,
         0.31454956,  0.34325475,  0.37195994,  0.40066514,  0.42937033,
         0.45807552,  0.48678071,  0.51548591,  0.5441911 ,  0.57289629,
         0.60160148,  0.63030668,  0.65901187,  0.68771706,  0.71642225,
         0.74512745]),
 array([    0.,     0.,     0.,     0.,     0.,     0.,     0.,  1234.,
         2372.,  2180.,  2115.,  1212.,   917.,   663.,   473.,   353.,
          251.,   186.,   123.,    99.,    60.,    44.,    31.,    25.,
           15.,    13.,     9.,     3.,     5.,     3.]))</pre>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>The easiest way to plot the histogram from these two arrays is to look at it
as a step function, and create a line plot with the appropriate drawing style.
The only caveat is that we need to add an extra <code>0</code> element to draw the right 
side of the last histogram bin.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[32]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">plt</span><span class="o">.</span><span class="n">plot</span><span class="p">(</span><span class="n">hist</span><span class="o">.</span><span class="n">binedges</span><span class="p">,</span> <span class="n">np</span><span class="o">.</span><span class="n">append</span><span class="p">(</span><span class="n">hist</span><span class="o">.</span><span class="n">binvalues</span><span class="p">,</span> <span class="mi">0</span><span class="p">),</span> <span class="n">drawstyle</span><span class="o">=</span><span class="s1">&#39;steps-post&#39;</span><span class="p">)</span>   <span class="c1"># or maybe steps-mid, for integers</span>
<span class="n">plt</span><span class="o">.</span><span class="n">show</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt"></div>




<div class="output_png output_subarea ">
<img src="data:image/png;base64,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
"
>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>Another way to plot a recorded histogram is Matplotlib's <code>hist()</code> method, 
although that is a bit tricky. Instead of taking histogram data, <code>hist()</code> 
insists on computing the histogram itself from an array of values -- but we only
have the histogram, and not the data it was originally computed from.
Fortunately, <code>hist()</code> can accept a bin edges array, and another array as weights 
for the values. Thus, we can trick it into doing what we want by passing 
in our <code>binedges</code> array twice, once as bin edges and once as values, and 
specifying <code>binvalues</code> as weights.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[33]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">plt</span><span class="o">.</span><span class="n">hist</span><span class="p">(</span><span class="n">bins</span><span class="o">=</span><span class="n">hist</span><span class="o">.</span><span class="n">binedges</span><span class="p">,</span> <span class="n">x</span><span class="o">=</span><span class="n">hist</span><span class="o">.</span><span class="n">binedges</span><span class="p">[:</span><span class="o">-</span><span class="mi">1</span><span class="p">],</span> <span class="n">weights</span><span class="o">=</span><span class="n">hist</span><span class="o">.</span><span class="n">binvalues</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">show</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt"></div>




<div class="output_png output_subarea ">
<img src="data:image/png;base64,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
rYGXkSQEnSAAAAAASUVORK5CYII=
"
>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p><code>hist()</code> has some interesting options. For example, we can change the plotting
style to be similar to a line plot by setting <code>histtype='step'</code>. To plot the
normalized version of the histogram, specify <code>normed=True</code> or <code>density=True</code> 
(they work differently; see the Matplotlib documentation for details). 
To draw the cumulative density function, also specify <code>cumulative=True</code>. 
The following plot shows the effect of some of these options.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[34]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">plt</span><span class="o">.</span><span class="n">hist</span><span class="p">(</span><span class="n">bins</span><span class="o">=</span><span class="n">hist</span><span class="o">.</span><span class="n">binedges</span><span class="p">,</span> <span class="n">x</span><span class="o">=</span><span class="n">hist</span><span class="o">.</span><span class="n">binedges</span><span class="p">[:</span><span class="o">-</span><span class="mi">1</span><span class="p">],</span> <span class="n">weights</span><span class="o">=</span><span class="n">hist</span><span class="o">.</span><span class="n">binvalues</span><span class="p">,</span> <span class="n">histtype</span><span class="o">=</span><span class="s1">&#39;step&#39;</span><span class="p">,</span> <span class="n">normed</span><span class="o">=</span><span class="bp">True</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">show</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt"></div>




<div class="output_png output_subarea ">
<img src="data:image/png;base64,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
QmCC
"
>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>To plot several histograms, we can iterate over the histograms and draw them
one by one on the same plot. The following code does that, and also adds a 
legend and adjusts the bounds of the x axis.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[35]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">somehistograms</span> <span class="o">=</span> <span class="n">histograms</span><span class="p">[</span><span class="n">histograms</span><span class="o">.</span><span class="n">name</span> <span class="o">==</span> <span class="s1">&#39;collisionLength:histogram&#39;</span><span class="p">][:</span><span class="mi">5</span><span class="p">]</span>
<span class="k">for</span> <span class="n">row</span> <span class="ow">in</span> <span class="n">somehistograms</span><span class="o">.</span><span class="n">itertuples</span><span class="p">():</span>
    <span class="n">plt</span><span class="o">.</span><span class="n">plot</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">binedges</span><span class="p">,</span> <span class="n">np</span><span class="o">.</span><span class="n">append</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">binvalues</span><span class="p">,</span> <span class="mi">0</span><span class="p">),</span> <span class="n">drawstyle</span><span class="o">=</span><span class="s1">&#39;steps-post&#39;</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">legend</span><span class="p">(</span><span class="n">somehistograms</span><span class="o">.</span><span class="n">module</span> <span class="o">+</span> <span class="s2">&quot;.&quot;</span> <span class="o">+</span> <span class="n">somehistograms</span><span class="o">.</span><span class="n">name</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">xlim</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span> <span class="mf">0.5</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">show</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt"></div>




<div class="output_png output_subarea ">
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYIAAAEACAYAAAC+gnFaAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz
AAALEgAACxIB0t1+/AAAIABJREFUeJzt3XuUU/W99/H3Fwe03BMQGGZGUEGl9ixvzyNa9HSQesH7
EUWwSLXY5aWC1XqWQIuAVo9oHbUeL6216pSK+rRyq1ooyigcW+Wgogx4oSIIKCIzA0IV5/J9/kgm
JnPNJJlJZvJ5rZVF8svOzs5vwv5m//blY+6OiIhkr07pXgAREUkvFQIRkSynQiAikuVUCEREspwK
gYhIllMhEBHJcs0WAjPb38xeM7M3zewdM5sZbh9sZv8ws/fNbJ6Z5YTbu5jZU2b2gZn93cwOiprX
tHD7ejM7rfU+loiIxKvZQuDu+4CR7n4McDQw2syGA3OAu939MKACmBR+ySSgzN2HAvcCdwKY2beB
scAwYDTwoJlZij+PiIi0UFxDQ+7+r/Dd/YEcwIGRwJ/D7U8A54fvnxd+DPAn4JTw/XOBp9y9yt0/
Aj4Ajk9m4UVEJHlxFQIz62RmbwKfAn8D/glUuHtNeJItQF74fh7wMYC7VwO7zCwY3R62Neo1IiKS
JvFuEdSEh4byCf2KP6IF76HhHxGRDJbTkondfbeZlQAnAr3NrFN4qyCf0C98wv8WANvMbD+gp7uX
mVlte63o10SYmS5+JCKSAHdP6Id3PEcN9TWzXuH73wJOBdYBy4GLwpP9EFgYvr8o/Jjw8y9FtY8L
H1V0MDAEeL2h93R33dyZOXNm2pchU27qC/WF+qLpWzLi2SLIBZ4ws06ECsfT7v68ma0HnjKzW4E3
gUfD0z8K/MHMPgB2AuPCK/d1ZvYMoSJSCVzjyS69iIgkrdlC4O7vAMc20L4RGN5A+z5Ch4k2NK//
Av6r5YspIiKtRWcWZ7DCwsJ0L0LGUF98Q33xDfVFalimjc6YmUaMRERayMzwBHcWt+ioIWmZwYMH
s2nTpnQvhoh0IIMGDeKjjz5K6Ty1RdCKwhU63YshIh1IY+uVZLYItI9ARCTLqRCIiGQ5FQIRkSyn
QiD1XH755dx8881xTdupUyc+/PDDVl6i9u/RRx9l5MiRAFRXV9OpUyc2b94MwI9//GPuuOOOZudx
xBFH8D//8z+tupxt6dJLL+WWW26Ja9q6fVZXcXExZ511VioXL6uoEGS5wsJCgsEglZWVCb1ekRLx
i+6r6PuPPPIIU6dObfb17777LiNGjEh6OVqyAk6V6EKYqKa+axMnTuS5555rdh7p+OztgQpBFtu0
aRMrV66kU6dOLFq0KKF5ZNpRUdXV1Rk5r7oyrd9am7sn/aMh0/usNb8vrU2FIIsVFxdz4oknctll
l/H44483Ot0jjzzC0KFD6du3L+effz6ffPJJzPN/+9vfOOywwwgGg1x77bWR9g8//JBRo0bRt29f
+vXrx4QJE9i9e3eD77Fv3z4uvfRS+vbtSyAQYPjw4ezYsQOA3bt3c8UVVzBw4EAKCgqYMWNGZKXw
xBNPcNJJJ3HDDTdw4IEHMmPGDAKBAOvWrYvM+/PPP6dr1658/vnnAPzlL3/hmGOOIRAIcNJJJ/HO
O+9Epj344IO58847Oeqoo+jevTs1NTXU9corr3DiiSfSu3dvBg0axB//+EcAdu3axYQJE+jXrx+H
HHJIXMM9EPsrdceOHZx11lkEAgH69OkTc+ZsQUEBr7zySqS/pkyZEumTn/3sZ1RVVQHw4osvcvDB
B3PXXXfRr18/8vPz+cMf/hDXsqxbt45TTz2VPn368O1vf5tnn302Zjmvu+46zjzzTHr27MmIESNi
zpN54YUXOPzwwwkEAkyZMoWTTjqJ4uJi1q5dy+TJk1mxYgU9evSgX79+kdfs3Lmz0fk15K9//StD
hw6lT58+XHfddZH26C0Od2fKlCn079+f3r17c/TRR/Puu+/y0EMP8fTTT3P77bfTs2dPxowZA0Bp
aSmFhYUEAgGOOuoonn/++ch8P//8c8466yx69erFCSecwM9//vN6Q3wPPfQQQ4cOZdiwYQBMnjyZ
goICevfuzfDhw/n73/8emd+MGTMYP348l1xyCT169OCYY47hww8/5LbbbqNfv34MHjyYl156iTaX
7ivmNXAFPe8oMv2zDBkyxB9++GFfvXq1d+7c2T/77DN3d7/ssst8xowZ7u7+4osvet++ff2tt97y
r7/+2idPnuz//u//HpmHmfk555zju3fv9s2bN/uBBx7oS5YscXf3DRs2+LJly7yystI///xz/973
vufXX399g8vym9/8xs8991z/6quvvKamxt944w3/4osv3N39/PPP96uvvtq//PJL37Fjhw8fPtx/
+9vfurv7448/7jk5Of7AAw94dXW1f/nllz5p0iT/xS9+EZn3Aw884KNHj3Z39zfeeMP79evnq1at
8pqaGi8uLvbBgwf7119/7e7ugwcP9mOOOca3bt3qX331Vb3l3Lhxo3fv3t3/9Kc/eXV1te/cudPX
rFnj7u7jx4/3MWPG+N69e/3DDz/0IUOGeHFxsbu7/+53v/ORI0e6u3tVVZWbmW/atMnd3SdMmOCz
Z892d/f//M//9MmTJ3t1dbVXVlb6ihUrIu+dn5/vL7/8sru7T5s2zUeMGOE7d+6M9Mktt9zi7u7L
li3znJwcv/XWW72qqsoXLVrk3bp1i/Rn9PtF27Nnj+fl5fncuXMjf4M+ffr4+++/H3ndgQce6G+8
8YZXVVX5xRdf7Jdeeqm7u2/fvt179Ojhixcv9qqqKi8qKvIuXbr4E088Ue/z12pqfu7uo0eP9rvv
vjumz84//3z/4osv/KOPPvJgMOgvvvhivfk/99xzPnz48MjnXb9+vW/fvr3Bz/7111/7wQcf7L/6
1a+8qqrKly1b5t27d/d//vOf7u4+ZswYnzBhgu/bt8/Xrl3reXl59f6Oo0eP9oqKisj3Ze7cuV5R
UeHV1dV+5513el5eXuT79Ytf/MK7du3qL730kldXV/sll1ziBx98sM+ZM8erq6v9oYce8qFDh9b7
20RrbL0Sbk9svZvoC1vrlukrz5Zo7rNAam6JWLFihXfp0sXLysrc3X3YsGF+7733untsIZg0aZLf
dNNNkdft2bPHO3fuHFmJmZm/+uqrkefHjh3rc+bMafA9FyxY4Mcee2yDz/3+97/3ESNG+Ntvvx3T
vn37dt9///1jVsrz5s2L/Gd8/PHHfdCgQTGvWbZsmR966KGRxyNGjPC5c+e6u/vVV1/tN998c8z0
hx9+uL/yyivuHioEjz/+eIPL6O5+6623+tixY+u1V1ZWek5Ojm/YsCHS9sADD/ipp57q7vEXgunT
p/uYMWMiK6Jo0YVg0KBBvmzZsshzzz33XGQFsmzZMu/Ro4fX1NREng8Gg7569ep67xftj3/8o59y
yikxbZMmTfLbb7898rqrr7468tyiRYv83/7t39w99PeL/oHg7p6bm9tsIWhsfnXV9tnrr78eabvg
ggsihSJ6/kuXLvVhw4b5a6+9FtMHDX325cuXe35+fsw0F110kd92222Rv+nGjRsjz02dOrXe33Hl
ypUNLrO7e01Njffo0cPXrVvn7qFCcOaZZ0aenz9/vvfu3TvyuLy83Dt16uR79+5tdJ6tUQg0NJRG
qSoFiSguLua0004jEAgAMH78eJ544ol6023bto1BgwZFHnfr1o0+ffqwdes3mUL9+/eP3O/atSt7
9uwB4LPPPmP8+PHk5+fTu3dvJkyYEBmeqWvixImcfvrpjBs3jvz8fKZOnUp1dTWbNm2isrKS3Nxc
gsEggUCAq666KmY+BQUFMfMaOXIkX375JatWrWLTpk2sWbOG888PRWpv2rSJu+++m2AwGJnfli1b
2LZtW+T1+fn5jfbbxx9/zKGHHlqv/bPPPqOmpoaDDjoo0jZo0KCYforHtGnTOOiggxg1ahRDhw7l
V7/6VYPTbdu2rcn36tu3b8yYfPTfpTG1+4yi++aZZ57h008/jUwzYMCABue5bdu2en+Hpvqxufk1
prHvWrRTTz2Vq666iquvvpoBAwZwzTXXsHfv3gbnV7cf4Zu+3L59OzU1NTGfo+5nhPqf884772TY
sGEEAgGCwSD/+te/Yr6v0Z/hW9/6FgceeGDMY3dvth9STYUgC3311Vc888wzvPzyy+Tm5pKbm8s9
99zDmjVrePvtt2OmHThwYMy47d69e9m5c2dc/8mnT59Op06dKC0tpaKigrlz59Zu9dWz3377MWPG
DEpLS3n11VdZvHgxxcXFFBQUcMABB7Bz507KysooLy+noqIiZjnr7oTs1KkTY8eO5cknn2TevHmc
ffbZdOvWDQj9R/75z39OWVlZZH579uzh4osvbnR+0QoKCtiwYUO99n79+rHffvvF9NWmTZvIy2tZ
LHf37t0pKipi48aNLFiwgDlz5rBixYp609X9uyTyXnUVFBTw/e9/P6Zvdu/ezX333dfsa3Nzc/n4
449j2qILU1sfXTZlyhRWr17N2rVrKS0tpaioqMHlGDhwYL3l3rx5M3l5efTv3x8zY8uWLZHn6k5b
d54lJSXcc889zJ8/n/LycsrLy+nWrVuj3/uGpONIPBWCLDR//nxycnJYv349a9asYc2aNbz77ruc
fPLJFBcXx0w7fvx4HnvsMd5++2327dvH9OnTOeGEExr8ZVTXF198Qffu3enRowdbt27lrrvuanTa
kpIS1q5dS01NDd27d6dz587st99+DBgwgNNOO43rr7+eL774Anfnww8/jOw0bcz48eN5+umnefLJ
J7nkkksi7T/+8Y95+OGHef31UDje3r17ef755xv9xVjXhAkTWLJkCfPnz6e6upqdO3fy9ttvk5OT
w4UXXsj06dPZu3cvGzdu5N577+XSSy+Na761/vKXv0TOy+jRowc5OTnst99+DX6+W265hZ07d7Jj
xw5++ctftui9Kisr2bdvX+RWWVnJueeeS2lpKfPmzaOqqorKykpWrVrFBx980Oz8zj77bN58802e
e+45qquruffee+v9Ct6yZUtkh3ZrWrVqFatWraK6uppvfetbdOnShU6dOkWWI/q8l+9+97vk5ORQ
VFREVVUVL730Ei+88ALjxo0jJyeH//iP/2DmzJl89dVXlJaWMnfu3Cbf+4svvqBz584Eg0G+/vpr
Zs6cyb/+9a8WLX9LikaqqBBkoeLiYn70ox+Rl5dHv379Iref/OQnPPnkkzGHwY0aNYpbb72VCy64
gLy8PDZu3MhTTz0Veb6pXy8zZ85k9erV9O7dm3POOSdylEatM888M3JkzaeffsqFF15Ir169OPLI
Ixk5ciQTJkyILO/XX3/Nt7/9bYLBIBdddFHMcEVDjj/+eLp168Ynn3zC6NGjI+3HHXccjzzyCNde
ey3BYJDDDjssZkisoc9z+umnR4ZoBg8ezOLFi7njjjsIBoMcd9xxrF27FoAHHniAzp07M3jwYEaO
HMnll1/e6Mq5sX577733OOWUU+jRowcnn3wyP/3pT/nud79b7zUzZ87kqKOO4jvf+Q5HH300J554
YpPnItR9v9tvv52uXbtGbqeffjo9e/ZkyZIlzJ07l9zcXAYOHMj06dPZt29fk8sMoS2ip59+muuv
v56+ffuyceNGjjnmGPbff38gNFwzdOhQ+vfvz8CBAxudT7Tofm/o/RtbnoqKCiZNmkQgEOCQQw4h
Ly+PG264AYArrriCt956iz59+jB27Fi6dOnC4sWLWbBgAX379uWnP/0p8+bN45BDDgHgwQcf5PPP
P2fAgAFMmjSJSy65JPKZGlqGM888MzKsd8ghh9C7d29yc3Pj+rzNfa7WpKuPtiJdfVSyVU1NDQMH
DuTPf/5zSk6CyxQ33ngju3bt4pFHHknbMujqoyKSsZYsWcKuXbvYt28ft9xyC126dOH4449P92Il
Zf369ZEtvn/84x889thjXHDBBWleqtRTMI2IpMTKlSu55JJLqK6u5sgjj2TBggV07tw53YuVlN27
d/ODH/yATz/9lP79+zN9+vSYocaOQkNDrUhDQyKSahoaEhGRlFMhEBHJcioEIiJZToVARCTLqRCI
iGQ5FQKpR1GVqaeoyvoUVZk5VAiynKIq246iKhVVmamaLQRmlm9mL5lZqZm9Y2aTw+0zzWyLmb0R
vp0R9ZppZvaBma03s9Oi2s8ws3fN7H0zu6l1PpLES1GVbTevujKt31qbu6IqM1k8WwRVwA3ufiRw
InCtmR0Rfq7I3Y8N3/4KYGbDgLHAMGA08KCFdAL+GzgdOBIYHzUfSQNFVSqqsi5FVSqqMt4EsQXA
KGAm8LMGnp8K3BT1+AVgOHAC8EJj00W1N5rM095k+mdRVKWiKqMpqlJRlfEWgcHAR0D3cCH4EHgL
+B3QKzzN/cAlUa/5HXABMAb4bVT7BODXDbxHk53QnjT3WZhFSm6JUFTlNxRVGaKoypBsjKqM+6Jz
ZtYd+BNwnbvvMbMHgVvc3c3sl8DdwBXxzk/AZ6ZvzLOxqMrozW0IRfkdd9xxkcfRUZW1EX9NRVVe
d911rFixgj179lBdXU0wGGxweSZOnMiWLVsYN25cZIjltttui4mqhG9+uETHCzYVVdmvX796UZXF
xcXcf//9kflVVlZmVFTlzTffzKhRo8jJyeHKK6/kxhtvrDdda0dVQqhvqqurufzyyyPTtLeoyi1b
tjBmzBjuuuuuSEpdtESiKl977bWY6RuKqnzssccimRmJRlV27dq1yb5IpbgKgZnlECoCf3D3hQDu
viNqkkeAxeH7W4Hob0R+uM2Agxpor2fWrFmR+4WFhTHjpJK82qjKmpqayAp237597Nq1q9WiKnv1
6sXChQuZPHlyg9PWRlXOmDGDzZs3M3r0aA4//HBGjx4diapsbGdjU1GV/fv3bzCqctq0aY0ud3NR
lXX7CGKjKocMGQIkF1VZVFQUGbsePnw4J598csx0tX+XoUOHJvxeddVGVcZz9E1dubm5LF26NKYt
3VGVU6ZMYceOHVx44YUUFRUxY8aMuKMqjzrqqJioysGDBwPxR1UuX76cI44I7QLt1atXq0RVlpSU
UFJSEvd8mxLv4aO/B9a5eyS81MwGRD1/AbA2fH8RMM7MupjZwcAQ4HVgFTDEzAaZWRdgXHjaembN
mhW5qQiknqIqFVWpqMqQ9hxVWVhYGLOuTEY8h4+OAH4AnGJmb0YdKnqnmb1tZm8B3wOuB3D3dcAz
wDrgeeCa8BBWNXAtsBQoBZ5y9/VJLb0kRFGViqpUVKWiKmPesyWbLG1BeQQi7Z+iKluP8ghEJGMp
qrL9UlSliKSEoirbLw0NtSINDYlIqmloSEREUk6FQEQky6kQiIhkORUCEZEsp0IgIpLlVAikHkVV
pp6iKutTVGXmUCHIcoqqbDuKqlRUZaZSIchiiqpsu3nVlWn91tpcUZUZTYUgiymqUlGVdSmqUlGV
GXEjixLK0k1RlYqqjKaoSkVVZswt01eeLdHsZ4HU3BKgqMpvKKoyRFGVIdkYVamhoXRKVSlIQGNR
lXVt27aNQYMGRR5HR1XWaiqqcvz48eTn59O7d28mTJgQE1YSbeLEiZx++umMGzeO/Px8pk6dSnV1
dUxUZTAYJBAIcNVVV8XMp6moyk2bNtWLqrz77rsJBoOR+W3ZsiWjoioPOuigyDXto6/HH621oypr
++aZZ56JyX5ob1GVAwYM4Jprrmk0eCiRqMq6GoqqHDZsGIFAgGAwmHBUZVtSIchCtVGVL7/8Mrm5
ueTm5nLPPfewZs2aVouqrKioYO7cubVbffXURlWWlpby6quvsnjxYoqLiykoKIhEVZaVlVFeXk5F
RUXMcjYVVTlv3rwGoyrLysoi89uzZw8XX3xxo/OLVlBQwIYNG+q1R0dV1komqnLjxo0sWLCAOXPm
sGLFinrT1f27pDKqMrpvdu/ezX333dfsa3Nzc+vFOKY7qnL16tWsXbuW0tJSioqKGlyOxqIq8/Ly
YqIqa8UbVTl//nzKy8spLy+nW7dujX7vG5KOI/FUCLKQoioVVamoypD2HFWZSioEWUhRlYqqVFSl
oipj3jMd1acpyiMQaf8UVdl6lEcgIhlLUZXtl6IqRSQlFFXZfmloqBVpaEhEUk1DQyIiknIqBCIi
WU6FQEQky6kQiIhkORUCEZEsp0Ig9SiqMvUUVVmfoiozhwpBllNUZdtRVKWiKjNVs4XAzPLN7CUz
KzWzd8xsSrg9YGZLzew9M1tiZr2iXvNrM/vAzN4ys6Oj2n9oZu+HXzOxdT6SxEtRlW03r7oyrd9a
m7uiKjNZPFsEVcAN7n4kcCLwEzM7ApgKLHP3w4GXgGkAZjYaONTdhwJXAg+H2wPAzcD/BYYDM6OL
h7Q9RVUqqrIuRVUqqjLeBLEFwPeBd4H+4bYBwPrw/YeBi6OmXw/0B8YBD0W1PxQ9XVR7o8k87U2m
fxZFVSqqMpqiKhVVGW8RGAx8BHQHyus8Vxb+dzHw3aj2vwHHAj8Dpke1/4LQlkbWFgKWL0/JLRGK
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
FCkxnfZMZcsAAAAASUVORK5CYII=
"
>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>Note, however, that the legend contains the same string for all histograms, 
which is not very meaningful. We could improve that by including some 
characteristics of the simulation that generated them, i.e. the number of hosts
(<code>numHosts</code> iteration variable) and frame interarrival times (<code>iaTime</code> iteration
variable). We'll see in the next section how that can be achieved.</p>
<h2 id="10.-Adding-iteration-variables-as-columns">10. Adding iteration variables as columns<a class="anchor-link" href="#10.-Adding-iteration-variables-as-columns">&#194;&#182;</a></h2><p>In this step, we add the iteration variables associated with the simulation
run to the data frame as columns. There are several reasons why this is a
good idea: they are very useful for generating the legends for plots of
e.g. histograms and vectors (e.g. "collision multiplicity histogram for
numHosts=20 and iaMean=2s"), and often needed as chart input as well.</p>
<p>First, we select the iteration variables vars as a smaller data frame.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[36]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">itervars_df</span> <span class="o">=</span> <span class="n">aloha</span><span class="o">.</span><span class="n">loc</span><span class="p">[</span><span class="n">aloha</span><span class="o">.</span><span class="n">type</span><span class="o">==</span><span class="s1">&#39;itervar&#39;</span><span class="p">,</span> <span class="p">[</span><span class="s1">&#39;run&#39;</span><span class="p">,</span> <span class="s1">&#39;attrname&#39;</span><span class="p">,</span> <span class="s1">&#39;attrvalue&#39;</span><span class="p">]]</span>
<span class="n">itervars_df</span><span class="o">.</span><span class="n">head</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[36]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">
<div>
<style>
    .dataframe thead tr:only-child th {
        text-align: right;
    }

    .dataframe thead th {
        text-align: left;
    }

    .dataframe tbody tr th {
        vertical-align: top;
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
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
      <td>iaMean</td>
      <td>2</td>
    </tr>
    <tr>
      <th>15</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
      <td>numHosts</td>
      <td>10</td>
    </tr>
    <tr>
      <th>42</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>iaMean</td>
      <td>1</td>
    </tr>
    <tr>
      <th>43</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>numHosts</td>
      <td>10</td>
    </tr>
    <tr>
      <th>70</th>
      <td>PureAlohaExperiment-1-20170627-20:42:17-22739</td>
      <td>iaMean</td>
      <td>1</td>
    </tr>
  </tbody>
</table>
</div>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>We reshape the result by using the <code>pivot()</code> method. The following statement
will convert unique values in the <code>attrname</code> column into separate columns:
<code>iaMean</code> and <code>numHosts</code>. The new data frame will be indexed with the run id.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[37]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">itervarspivot_df</span> <span class="o">=</span> <span class="n">itervars_df</span><span class="o">.</span><span class="n">pivot</span><span class="p">(</span><span class="n">index</span><span class="o">=</span><span class="s1">&#39;run&#39;</span><span class="p">,</span> <span class="n">columns</span><span class="o">=</span><span class="s1">&#39;attrname&#39;</span><span class="p">,</span> <span class="n">values</span><span class="o">=</span><span class="s1">&#39;attrvalue&#39;</span><span class="p">)</span>
<span class="n">itervarspivot_df</span><span class="o">.</span><span class="n">head</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[37]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">
<div>
<style>
    .dataframe thead tr:only-child th {
        text-align: right;
    }

    .dataframe thead th {
        text-align: left;
    }

    .dataframe tbody tr th {
        vertical-align: top;
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

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>Now, we only need to add the new columns back into the original dataframe, using
<code>merge()</code>. This operation is not quite unlike an SQL join of two tables on the
<code>run</code> column.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[38]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">aloha2</span> <span class="o">=</span> <span class="n">aloha</span><span class="o">.</span><span class="n">merge</span><span class="p">(</span><span class="n">itervarspivot_df</span><span class="p">,</span> <span class="n">left_on</span><span class="o">=</span><span class="s1">&#39;run&#39;</span><span class="p">,</span> <span class="n">right_index</span><span class="o">=</span><span class="bp">True</span><span class="p">,</span> <span class="n">how</span><span class="o">=</span><span class="s1">&#39;outer&#39;</span><span class="p">)</span>
<span class="n">aloha2</span><span class="o">.</span><span class="n">head</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[38]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">
<div>
<style>
    .dataframe thead tr:only-child th {
        text-align: right;
    }

    .dataframe thead th {
        text-align: left;
    }

    .dataframe tbody tr th {
        vertical-align: top;
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
      <th>iaMean</th>
      <th>numHosts</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
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
      <td>2</td>
      <td>10</td>
    </tr>
    <tr>
      <th>1</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
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
      <td>2</td>
      <td>10</td>
    </tr>
    <tr>
      <th>2</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
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
      <td>2</td>
      <td>10</td>
    </tr>
    <tr>
      <th>3</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
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
      <td>2</td>
      <td>10</td>
    </tr>
    <tr>
      <th>4</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>iterationvars</td>
      <td>numHosts=10, iaMean=2</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>None</td>
      <td>None</td>
      <td>2</td>
      <td>10</td>
    </tr>
  </tbody>
</table>
</div>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>For plot legends, it is also useful to have a single <code>iterationvars</code> column with
string values like <code>numHosts=10, iaMean=2</code>. This is easier than the above: we
can just select the rows containing the run attribute named <code>iterationvars</code>
(it contains exactly the string we need), take only the <code>run</code> and <code>attrvalue</code>
columns, rename the <code>attrvalue</code> column to <code>iterationvars</code>, and then merge back the
result into the original data frame in a way we did above.</p>
<p>The selection and renaming step can be done as follows. (Note: we need
<code>.astype(str)</code> in the condition so that rows where <code>attrname</code> is not filled in
do not cause trouble.)</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[39]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">itervarscol_df</span> <span class="o">=</span> <span class="n">aloha</span><span class="o">.</span><span class="n">loc</span><span class="p">[(</span><span class="n">aloha</span><span class="o">.</span><span class="n">type</span><span class="o">==</span><span class="s1">&#39;runattr&#39;</span><span class="p">)</span> <span class="o">&amp;</span> <span class="p">(</span><span class="n">aloha</span><span class="o">.</span><span class="n">attrname</span><span class="o">.</span><span class="n">astype</span><span class="p">(</span><span class="nb">str</span><span class="p">)</span><span class="o">==</span><span class="s1">&#39;iterationvars&#39;</span><span class="p">),</span> <span class="p">[</span><span class="s1">&#39;run&#39;</span><span class="p">,</span> <span class="s1">&#39;attrvalue&#39;</span><span class="p">]]</span>
<span class="n">itervarscol_df</span> <span class="o">=</span> <span class="n">itervarscol_df</span><span class="o">.</span><span class="n">rename</span><span class="p">(</span><span class="n">columns</span><span class="o">=</span><span class="p">{</span><span class="s1">&#39;attrvalue&#39;</span><span class="p">:</span> <span class="s1">&#39;iterationvars&#39;</span><span class="p">})</span>
<span class="n">itervarscol_df</span><span class="o">.</span><span class="n">head</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[39]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">
<div>
<style>
    .dataframe thead tr:only-child th {
        text-align: right;
    }

    .dataframe thead th {
        text-align: left;
    }

    .dataframe tbody tr th {
        vertical-align: top;
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
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
      <td>numHosts=10, iaMean=2</td>
    </tr>
    <tr>
      <th>32</th>
      <td>PureAlohaExperiment-0-20170627-20:42:16-22739</td>
      <td>numHosts=10, iaMean=1</td>
    </tr>
    <tr>
      <th>60</th>
      <td>PureAlohaExperiment-1-20170627-20:42:17-22739</td>
      <td>numHosts=10, iaMean=1</td>
    </tr>
    <tr>
      <th>88</th>
      <td>PureAlohaExperiment-2-20170627-20:42:19-22739</td>
      <td>numHosts=10, iaMean=2</td>
    </tr>
    <tr>
      <th>116</th>
      <td>PureAlohaExperiment-4-20170627-20:42:20-22739</td>
      <td>numHosts=10, iaMean=3</td>
    </tr>
  </tbody>
</table>
</div>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>In the merging step, we join the two tables (I mean, data frames) on the <code>run</code>
column:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[40]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">aloha3</span> <span class="o">=</span> <span class="n">aloha2</span><span class="o">.</span><span class="n">merge</span><span class="p">(</span><span class="n">itervarscol_df</span><span class="p">,</span> <span class="n">left_on</span><span class="o">=</span><span class="s1">&#39;run&#39;</span><span class="p">,</span> <span class="n">right_on</span><span class="o">=</span><span class="s1">&#39;run&#39;</span><span class="p">,</span> <span class="n">how</span><span class="o">=</span><span class="s1">&#39;outer&#39;</span><span class="p">)</span>
<span class="n">aloha3</span><span class="o">.</span><span class="n">head</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[40]:</div>



<div class="output_html rendered_html output_subarea output_execute_result">
<div>
<style>
    .dataframe thead tr:only-child th {
        text-align: right;
    }

    .dataframe thead th {
        text-align: left;
    }

    .dataframe tbody tr th {
        vertical-align: top;
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
      <th>iaMean</th>
      <th>numHosts</th>
      <th>iterationvars</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
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
      <td>2</td>
      <td>10</td>
      <td>numHosts=10, iaMean=2</td>
    </tr>
    <tr>
      <th>1</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
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
      <td>2</td>
      <td>10</td>
      <td>numHosts=10, iaMean=2</td>
    </tr>
    <tr>
      <th>2</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
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
      <td>2</td>
      <td>10</td>
      <td>numHosts=10, iaMean=2</td>
    </tr>
    <tr>
      <th>3</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
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
      <td>2</td>
      <td>10</td>
      <td>numHosts=10, iaMean=2</td>
    </tr>
    <tr>
      <th>4</th>
      <td>PureAlohaExperiment-3-20170627-20:42:20-22739</td>
      <td>runattr</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>iterationvars</td>
      <td>numHosts=10, iaMean=2</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>NaN</td>
      <td>None</td>
      <td>None</td>
      <td>2</td>
      <td>10</td>
      <td>numHosts=10, iaMean=2</td>
    </tr>
  </tbody>
</table>
</div>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>To see the result of our work, let's try plotting the same histograms again,
this time with a proper legend:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[41]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">histograms</span> <span class="o">=</span> <span class="n">aloha3</span><span class="p">[</span><span class="n">aloha3</span><span class="o">.</span><span class="n">type</span><span class="o">==</span><span class="s1">&#39;histogram&#39;</span><span class="p">]</span>
<span class="n">somehistograms</span> <span class="o">=</span> <span class="n">histograms</span><span class="p">[</span><span class="n">histograms</span><span class="o">.</span><span class="n">name</span> <span class="o">==</span> <span class="s1">&#39;collisionLength:histogram&#39;</span><span class="p">][:</span><span class="mi">5</span><span class="p">]</span>
<span class="k">for</span> <span class="n">row</span> <span class="ow">in</span> <span class="n">somehistograms</span><span class="o">.</span><span class="n">itertuples</span><span class="p">():</span>
    <span class="n">plt</span><span class="o">.</span><span class="n">plot</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">binedges</span><span class="p">,</span> <span class="n">np</span><span class="o">.</span><span class="n">append</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">binvalues</span><span class="p">,</span> <span class="mi">0</span><span class="p">),</span> <span class="n">drawstyle</span><span class="o">=</span><span class="s1">&#39;steps-post&#39;</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">title</span><span class="p">(</span><span class="s1">&#39;collisionLength:histogram&#39;</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">legend</span><span class="p">(</span><span class="n">somehistograms</span><span class="o">.</span><span class="n">iterationvars</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">xlim</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span> <span class="mf">0.5</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">show</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt"></div>




<div class="output_png output_subarea ">
<img src="data:image/png;base64,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
Ijnu/wMVKUGsrezAHQAAAABJRU5ErkJggg==
"
>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<h2 id="11.-Plotting-vectors">11. Plotting vectors<a class="anchor-link" href="#11.-Plotting-vectors">&#194;&#182;</a></h2><p>This section deals with basic plotting of output vectors. Output vectors
are basically time series data, but values have timestamps instead
of being evenly spaced. Vectors are in rows that have <code>"vector"</code>
in the <code>type</code> column. The values and their timestamps are in the
<code>vecvalue</code> and <code>vectime</code> columns as NumPy array objects (<code>ndarray</code>).</p>
<p>We'll use a different data set for exploring output vector plotting, one from
the <em>routing</em> example simulation. There are pre-recorded result files in the
<code>samples/resultfiles/routing</code> directory; change into it in the terminal, and
issue the following command to convert them to CSV:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">

<pre><code>scavetool x *.sca *.vec -o routing.csv</code></pre>

</div>
</div>
</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>Then we read the the CSV file into a data frame in the same way we saw with the
<em>aloha</em> dataset:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[42]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">routing</span> <span class="o">=</span> <span class="n">pd</span><span class="o">.</span><span class="n">read_csv</span><span class="p">(</span><span class="s1">&#39;../routing/routing.csv&#39;</span><span class="p">,</span> <span class="n">converters</span> <span class="o">=</span> <span class="p">{</span>
    <span class="s1">&#39;attrvalue&#39;</span><span class="p">:</span> <span class="n">parse_if_number</span><span class="p">,</span>
    <span class="s1">&#39;binedges&#39;</span><span class="p">:</span> <span class="n">parse_ndarray</span><span class="p">,</span>
    <span class="s1">&#39;binvalues&#39;</span><span class="p">:</span> <span class="n">parse_ndarray</span><span class="p">,</span>
    <span class="s1">&#39;vectime&#39;</span><span class="p">:</span> <span class="n">parse_ndarray</span><span class="p">,</span>
    <span class="s1">&#39;vecvalue&#39;</span><span class="p">:</span> <span class="n">parse_ndarray</span><span class="p">})</span>
</pre></div>

</div>
</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>Let us begin by selecting the vectors into a new data frame for convenience.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[43]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">vectors</span> <span class="o">=</span> <span class="n">routing</span><span class="p">[</span><span class="n">routing</span><span class="o">.</span><span class="n">type</span><span class="o">==</span><span class="s1">&#39;vector&#39;</span><span class="p">]</span>
<span class="nb">len</span><span class="p">(</span><span class="n">vectors</span><span class="p">)</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[43]:</div>




<div class="output_text output_subarea output_execute_result">
<pre>51</pre>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>Our data frame contains results from one run. To get some idea what vectors
we have, let's print the list unique vector names and module names:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[44]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">vectors</span><span class="o">.</span><span class="n">name</span><span class="o">.</span><span class="n">unique</span><span class="p">(),</span> <span class="n">vectors</span><span class="o">.</span><span class="n">module</span><span class="o">.</span><span class="n">unique</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[44]:</div>




<div class="output_text output_subarea output_execute_result">
<pre>(array([&#39;qlen:vector&#39;, &#39;busy:vector&#39;, &#39;txBytes:vector&#39;,
        &#39;endToEndDelay:vector&#39;, &#39;hopCount:vector&#39;, &#39;sourceAddress:vector&#39;,
        &#39;rxBytes:vector&#39;, &#39;drop:vector&#39;], dtype=object),
 array([&#39;Net5.rte[0].queue[0]&#39;, &#39;Net5.rte[0].queue[1]&#39;,
        &#39;Net5.rte[1].queue[0]&#39;, &#39;Net5.rte[1].queue[1]&#39;,
        &#39;Net5.rte[1].queue[2]&#39;, &#39;Net5.rte[2].queue[0]&#39;,
        &#39;Net5.rte[2].queue[1]&#39;, &#39;Net5.rte[2].queue[2]&#39;,
        &#39;Net5.rte[2].queue[3]&#39;, &#39;Net5.rte[3].queue[0]&#39;,
        &#39;Net5.rte[3].queue[1]&#39;, &#39;Net5.rte[3].queue[2]&#39;,
        &#39;Net5.rte[4].queue[0]&#39;, &#39;Net5.rte[4].queue[1]&#39;, &#39;Net5.rte[4].app&#39;,
        &#39;Net5.rte[1].app&#39;], dtype=object))</pre>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>A vector can be plotted on a line chart by simply passing the <code>vectime</code> and
<code>vecvalue</code> arrays to <code>plt.plot()</code>:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[45]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">vec</span> <span class="o">=</span> <span class="n">vectors</span><span class="p">[</span><span class="n">vectors</span><span class="o">.</span><span class="n">name</span> <span class="o">==</span> <span class="s1">&#39;qlen:vector&#39;</span><span class="p">]</span><span class="o">.</span><span class="n">iloc</span><span class="p">[</span><span class="mi">4</span><span class="p">]</span>  <span class="c1"># take some vector</span>
<span class="n">plt</span><span class="o">.</span><span class="n">plot</span><span class="p">(</span><span class="n">vec</span><span class="o">.</span><span class="n">vectime</span><span class="p">,</span> <span class="n">vec</span><span class="o">.</span><span class="n">vecvalue</span><span class="p">,</span> <span class="n">drawstyle</span><span class="o">=</span><span class="s1">&#39;steps-post&#39;</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">xlim</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span><span class="mi">100</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">show</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt"></div>




<div class="output_png output_subarea ">
<img src="data:image/png;base64,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
sn5I2ke9egAAAABJRU5ErkJggg==
"
>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>When several vectors need to be placed on the same plot, one can simply
use a <code>for</code> loop.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[46]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">somevectors</span> <span class="o">=</span> <span class="n">vectors</span><span class="p">[</span><span class="n">vectors</span><span class="o">.</span><span class="n">name</span> <span class="o">==</span> <span class="s1">&#39;qlen:vector&#39;</span><span class="p">][:</span><span class="mi">5</span><span class="p">]</span>
<span class="k">for</span> <span class="n">row</span> <span class="ow">in</span> <span class="n">somevectors</span><span class="o">.</span><span class="n">itertuples</span><span class="p">():</span>
    <span class="n">plt</span><span class="o">.</span><span class="n">plot</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">vectime</span><span class="p">,</span> <span class="n">row</span><span class="o">.</span><span class="n">vecvalue</span><span class="p">,</span> <span class="n">drawstyle</span><span class="o">=</span><span class="s1">&#39;steps-post&#39;</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">title</span><span class="p">(</span><span class="n">somevectors</span><span class="o">.</span><span class="n">name</span><span class="o">.</span><span class="n">values</span><span class="p">[</span><span class="mi">0</span><span class="p">])</span>
<span class="n">plt</span><span class="o">.</span><span class="n">legend</span><span class="p">(</span><span class="n">somevectors</span><span class="o">.</span><span class="n">module</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">show</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt"></div>




<div class="output_png output_subarea ">
<img src="data:image/png;base64,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
Fxrzly5dqhdffLFmZWVp9+7dddKkSRH33bNnj4qIOp1Oo21JSYkmJSWpzWZTm82mGRkZPtuhqrp7
924VEW1oaNBAgu2f7ukh83Bzj/AaA/8FYE2QeQGDtBomcWtqLftfoioqKlKbzaZ9+vQx1b6+vl7b
t2+vGRkZOmvWLFN9Fi9e7JPE46GyslJTU1M1OztbFyxYYKpPSUmJZmVlaVpamjY2NgZsE8skHs7V
KUR0lnrppZfw0ksvmW6fkpKC6urqGEYUG927d8eJEyfC6jNjxoy43logrCSuqu8DaP6CVCIiajH8
xSYRJYTbb7+9VRZJjjUmcSIiC2MSJyKyMCZxIiIL49Up1Cr06NHjjG/rShRrPXr0iNmymcSpVdiz
Z0+8QyALcYjDuJeO58Zo/vfWCXTDNO8+iXAvHoCnU4iILI1JnIjIwpjEiYgsjEmciMjCmMSJiCyM
SZyIyMKYxImILIxJnIjIwpjEiYgsjEmciMjCmMSJiCyMSZyIyMKYxImILIxJnIjIwpjEiYgsjEmc
iMjCmMSJiCwsZGUfETkHwAcAUtztV6lqSawDIyKi0EImcVWtF5FhqnpCRNoA+JuIvKWqH7VAfERE
1AxTp1NU9YT76TlwJX6NWURERGSaqSQuIkki8imAgwDeVdXNsQ2LiIjMMFXtXlUbAVwqIpkA3hCR
fqq61b9dcXGx8dxut8Nut59xYPGoJh2ourVHcnbToWquSnaiVMKOBoc4jO0fenRonKOhYPz33+Ts
5LP+/SrLKYOz2tmksr235OxkOKudpqZ79y/LKQt7fB0OBxyOpjFEwlQS91DVGhF5D8AoAM0m8dbA
OxGf7R+GQDs5JTa+Z8HHwMxn23u694GZJ5Gfyfj6H9yWlER+jUjI0yki0lFEstzPUwGMALA94jUT
EVHEzByJdwWwRESS4Er6f1bVdbENi4iIzDBzieG/AFzWArEQEVGY+ItNIiILYxInIrIwJnEiIgtj
EicisjAmcSIiC2MSJyKyMCZxIiILYxInIrIwJnEiIgtjEicisjAmcSIiC2MSJyKyMCZxIiILYxIn
IrIwJnEiIgtjEicisjAmcSIiC2MSJyKyMCZxIiILYxInIrIwJnEiIgtjEicisjAmcSIiCwuZxEWk
m4hsFJEKEfmXiNzXEoEREVFoySbaOAH8SlW3iEgGgH+KyHpV3R7j2IiIKISQR+KqelBVt7ifHwOw
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
VK+q+gAAAABJRU5ErkJggg==
"
>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<h2 id="12.-Vector-Filtering">12. Vector Filtering<a class="anchor-link" href="#12.-Vector-Filtering">&#194;&#182;</a></h2><p>Plotting vectors "as is" is often not practical, as the result will be a crowded
plot that's difficult to draw conclusions from. To remedy that, one can apply
some kind of filtering before plotting, or plot a derived quantity such as the
integral, sum or running average instead of the original. Such things can easily
be achieved with the help of NumPy.</p>
<p>Vector time and value are already stored in the data frame as NumPy arrays
(<code>ndarray</code>), so we can apply NumPy functions to them. For example, let's
try <code>np.cumsum()</code> which computes cumulative sum:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[47]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="n">x</span> <span class="o">=</span> <span class="n">np</span><span class="o">.</span><span class="n">array</span><span class="p">([</span><span class="mi">8</span><span class="p">,</span> <span class="mi">2</span><span class="p">,</span> <span class="mi">1</span><span class="p">,</span> <span class="mi">5</span><span class="p">,</span> <span class="mi">7</span><span class="p">])</span>
<span class="n">np</span><span class="o">.</span><span class="n">cumsum</span><span class="p">(</span><span class="n">x</span><span class="p">)</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[47]:</div>




<div class="output_text output_subarea output_execute_result">
<pre>array([ 8, 10, 11, 16, 23])</pre>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[48]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="k">for</span> <span class="n">row</span> <span class="ow">in</span> <span class="n">somevectors</span><span class="o">.</span><span class="n">itertuples</span><span class="p">():</span>
    <span class="n">plt</span><span class="o">.</span><span class="n">plot</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">vectime</span><span class="p">,</span> <span class="n">np</span><span class="o">.</span><span class="n">cumsum</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">vecvalue</span><span class="p">))</span>
<span class="n">plt</span><span class="o">.</span><span class="n">show</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt"></div>




<div class="output_png output_subarea ">
<img src="data:image/png;base64,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
"
>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>Plotting cumulative sum against time might be useful e.g. for an output
vector where the simulation emits the packet length for each packet
that has arrived at its destination. There, the sum would represent
"total bytes received".</p>
<p>Plotting the count against time for the same output vector would
represent "number of packets received". For such a plot, we can utilize
<code>np.arange(1,n)</code> which simply returns the numbers 1, 2, .., n-1
as an array:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[49]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="k">for</span> <span class="n">row</span> <span class="ow">in</span> <span class="n">somevectors</span><span class="o">.</span><span class="n">itertuples</span><span class="p">():</span>
    <span class="n">plt</span><span class="o">.</span><span class="n">plot</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">vectime</span><span class="p">,</span> <span class="n">np</span><span class="o">.</span><span class="n">arange</span><span class="p">(</span><span class="mi">1</span><span class="p">,</span> <span class="n">row</span><span class="o">.</span><span class="n">vecvalue</span><span class="o">.</span><span class="n">size</span><span class="o">+</span><span class="mi">1</span><span class="p">),</span> <span class="s1">&#39;.-&#39;</span><span class="p">,</span> <span class="n">drawstyle</span><span class="o">=</span><span class="s1">&#39;steps-post&#39;</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">xlim</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span><span class="mi">5</span><span class="p">);</span> <span class="n">plt</span><span class="o">.</span><span class="n">ylim</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span><span class="mi">20</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">show</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt"></div>




<div class="output_png output_subarea ">
<img src="data:image/png;base64,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
YII=
"
>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>Note that we changed the plotting style to "steps-post", so
that for any <em>t</em> time the plot accurately represents the number
of values whose timestamp is less than or equal to <em>t</em>.</p>
<p>As another warm-up exercise, let's plot the time interval
that elapses between adjacent values; that is, for each element
we want to plot the time difference between the that element
and the previous one.
This can be achieved by computing <code>t[1:] - t[:-1]</code>, which is the
elementwise subtraction of the <code>t</code> array and its shifted version.
Array indexing starts at 0, so <code>t[1:]</code> means "drop the first element".
Negative indices count from the end of the array, so <code>t[:-1]</code> means
"without the last element". The latter is necessary because the
sizes of the two arrays must match. or convenience, we encapsulate
the formula into a Python function:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[50]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="k">def</span> <span class="nf">diff</span><span class="p">(</span><span class="n">t</span><span class="p">):</span>
    <span class="k">return</span> <span class="n">t</span><span class="p">[</span><span class="mi">1</span><span class="p">:]</span> <span class="o">-</span> <span class="n">t</span><span class="p">[:</span><span class="o">-</span><span class="mi">1</span><span class="p">]</span>

<span class="c1"># example</span>
<span class="n">t</span> <span class="o">=</span> <span class="n">np</span><span class="o">.</span><span class="n">array</span><span class="p">([</span><span class="mf">0.1</span><span class="p">,</span> <span class="mf">1.5</span><span class="p">,</span> <span class="mf">1.6</span><span class="p">,</span> <span class="mf">2.0</span><span class="p">,</span> <span class="mf">3.1</span><span class="p">])</span>
<span class="n">diff</span><span class="p">(</span><span class="n">t</span><span class="p">)</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt output_prompt">Out[50]:</div>




<div class="output_text output_subarea output_execute_result">
<pre>array([ 1.4,  0.1,  0.4,  1.1])</pre>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>We can now plot it. Note that as <code>diff()</code> makes the array one element
shorter, we need to write <code>row.vectime[1:]</code> to drop the first element
(it has no preceding element, so <code>diff()</code> cannot be computed for it.)
Also, we use dots for plotting instead of lines, as it makes more
sense here.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[51]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="k">for</span> <span class="n">row</span> <span class="ow">in</span> <span class="n">somevectors</span><span class="o">.</span><span class="n">itertuples</span><span class="p">():</span>
    <span class="n">plt</span><span class="o">.</span><span class="n">plot</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">vectime</span><span class="p">[</span><span class="mi">1</span><span class="p">:],</span> <span class="n">diff</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">vectime</span><span class="p">),</span> <span class="s1">&#39;o&#39;</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">xlim</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span><span class="mi">100</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">show</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt"></div>




<div class="output_png output_subarea ">
<img src="data:image/png;base64,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
"
>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>We now know enough NumPy to be able to write a function that computes
running average (a.k.a. "mean filter"). Let's try it out in a plot
immediately.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[52]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="k">def</span> <span class="nf">running_avg</span><span class="p">(</span><span class="n">x</span><span class="p">):</span>
    <span class="k">return</span> <span class="n">np</span><span class="o">.</span><span class="n">cumsum</span><span class="p">(</span><span class="n">x</span><span class="p">)</span> <span class="o">/</span> <span class="n">np</span><span class="o">.</span><span class="n">arange</span><span class="p">(</span><span class="mi">1</span><span class="p">,</span> <span class="n">x</span><span class="o">.</span><span class="n">size</span> <span class="o">+</span> <span class="mi">1</span><span class="p">)</span>

<span class="c1"># example plot:</span>
<span class="k">for</span> <span class="n">row</span> <span class="ow">in</span> <span class="n">somevectors</span><span class="o">.</span><span class="n">itertuples</span><span class="p">():</span>
    <span class="n">plt</span><span class="o">.</span><span class="n">plot</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">vectime</span><span class="p">,</span> <span class="n">running_avg</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">vecvalue</span><span class="p">))</span>
<span class="n">plt</span><span class="o">.</span><span class="n">xlim</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span><span class="mi">100</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">show</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt"></div>




<div class="output_png output_subarea ">
<img src="data:image/png;base64,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
f8nr+s7QIbLHAAAAAElFTkSuQmCC
"
>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>For certain quantities such as queue length or on-off status,
weighted average (with time intervals used as weights) makes
more sense. Here is a function that computes running time-average:</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[53]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="k">def</span> <span class="nf">running_timeavg</span><span class="p">(</span><span class="n">t</span><span class="p">,</span><span class="n">x</span><span class="p">):</span>
    <span class="n">dt</span> <span class="o">=</span> <span class="n">t</span><span class="p">[</span><span class="mi">1</span><span class="p">:]</span> <span class="o">-</span> <span class="n">t</span><span class="p">[:</span><span class="o">-</span><span class="mi">1</span><span class="p">]</span>
    <span class="k">return</span> <span class="n">np</span><span class="o">.</span><span class="n">cumsum</span><span class="p">(</span><span class="n">x</span><span class="p">[:</span><span class="o">-</span><span class="mi">1</span><span class="p">]</span> <span class="o">*</span> <span class="n">dt</span><span class="p">)</span> <span class="o">/</span> <span class="n">t</span><span class="p">[</span><span class="mi">1</span><span class="p">:]</span>

<span class="c1"># example plot:</span>
<span class="k">for</span> <span class="n">row</span> <span class="ow">in</span> <span class="n">somevectors</span><span class="o">.</span><span class="n">itertuples</span><span class="p">():</span>
    <span class="n">plt</span><span class="o">.</span><span class="n">plot</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">vectime</span><span class="p">[</span><span class="mi">1</span><span class="p">:],</span> <span class="n">running_timeavg</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">vectime</span><span class="p">,</span> <span class="n">row</span><span class="o">.</span><span class="n">vecvalue</span><span class="p">))</span>
<span class="n">plt</span><span class="o">.</span><span class="n">xlim</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span><span class="mi">100</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">show</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt"></div>




<div class="output_png output_subarea ">
<img src="data:image/png;base64,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
"
>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>Computing the integral of the vector as a step function is very similar
to the <code>running_timeavg()</code> function. (Note: Computing integral in other
ways is part of NumPy and SciPy, if you ever need it. For example,
<code>np.trapz(y,x)</code> computes integral using the trapezoidal rule.)</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[54]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="k">def</span> <span class="nf">integrate_steps</span><span class="p">(</span><span class="n">t</span><span class="p">,</span><span class="n">x</span><span class="p">):</span>
    <span class="n">dt</span> <span class="o">=</span> <span class="n">t</span><span class="p">[</span><span class="mi">1</span><span class="p">:]</span> <span class="o">-</span> <span class="n">t</span><span class="p">[:</span><span class="o">-</span><span class="mi">1</span><span class="p">]</span>
    <span class="k">return</span> <span class="n">np</span><span class="o">.</span><span class="n">cumsum</span><span class="p">(</span><span class="n">x</span><span class="p">[:</span><span class="o">-</span><span class="mi">1</span><span class="p">]</span> <span class="o">*</span> <span class="n">dt</span><span class="p">)</span>

<span class="c1"># example plot:</span>
<span class="k">for</span> <span class="n">row</span> <span class="ow">in</span> <span class="n">somevectors</span><span class="o">.</span><span class="n">itertuples</span><span class="p">():</span>
    <span class="n">plt</span><span class="o">.</span><span class="n">plot</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">vectime</span><span class="p">[</span><span class="mi">1</span><span class="p">:],</span> <span class="n">integrate_steps</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">vectime</span><span class="p">,</span> <span class="n">row</span><span class="o">.</span><span class="n">vecvalue</span><span class="p">))</span>
<span class="n">plt</span><span class="o">.</span><span class="n">show</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt"></div>




<div class="output_png output_subarea ">
<img src="data:image/png;base64,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
hPEAAAAASUVORK5CYII=
"
>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>As the last example in this section, here is a function that computes
moving window average. It relies on the clever trick of subtracting
the cumulative sum of the original vector from its shifted version
to get the sum of values in every <em>N</em>-sized window.</p>

</div>
</div>
</div>
<div class="cell border-box-sizing code_cell rendered">
<div class="input">
<div class="prompt input_prompt">In&nbsp;[55]:</div>
<div class="inner_cell">
    <div class="input_area">
<div class=" highlight hl-ipython2"><pre><span></span><span class="k">def</span> <span class="nf">winavg</span><span class="p">(</span><span class="n">x</span><span class="p">,</span> <span class="n">N</span><span class="p">):</span>
    <span class="n">xpad</span> <span class="o">=</span> <span class="n">np</span><span class="o">.</span><span class="n">concatenate</span><span class="p">((</span><span class="n">np</span><span class="o">.</span><span class="n">zeros</span><span class="p">(</span><span class="n">N</span><span class="p">),</span> <span class="n">x</span><span class="p">))</span> <span class="c1"># pad with zeroes</span>
    <span class="n">s</span> <span class="o">=</span> <span class="n">np</span><span class="o">.</span><span class="n">cumsum</span><span class="p">(</span><span class="n">xpad</span><span class="p">)</span>
    <span class="n">ss</span> <span class="o">=</span> <span class="n">s</span><span class="p">[</span><span class="n">N</span><span class="p">:]</span> <span class="o">-</span> <span class="n">s</span><span class="p">[:</span><span class="o">-</span><span class="n">N</span><span class="p">]</span>
    <span class="n">ss</span><span class="p">[</span><span class="n">N</span><span class="o">-</span><span class="mi">1</span><span class="p">:]</span> <span class="o">/=</span> <span class="n">N</span>
    <span class="n">ss</span><span class="p">[:</span><span class="n">N</span><span class="o">-</span><span class="mi">1</span><span class="p">]</span> <span class="o">/=</span> <span class="n">np</span><span class="o">.</span><span class="n">arange</span><span class="p">(</span><span class="mi">1</span><span class="p">,</span> <span class="nb">min</span><span class="p">(</span><span class="n">N</span><span class="o">-</span><span class="mi">1</span><span class="p">,</span><span class="n">ss</span><span class="o">.</span><span class="n">size</span><span class="p">)</span><span class="o">+</span><span class="mi">1</span><span class="p">)</span>
    <span class="k">return</span> <span class="n">ss</span>

<span class="c1"># example:</span>
<span class="k">for</span> <span class="n">row</span> <span class="ow">in</span> <span class="n">somevectors</span><span class="o">.</span><span class="n">itertuples</span><span class="p">():</span>
    <span class="n">plt</span><span class="o">.</span><span class="n">plot</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">vectime</span><span class="p">,</span> <span class="n">winavg</span><span class="p">(</span><span class="n">row</span><span class="o">.</span><span class="n">vecvalue</span><span class="p">,</span> <span class="mi">10</span><span class="p">))</span>
<span class="n">plt</span><span class="o">.</span><span class="n">xlim</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span><span class="mi">200</span><span class="p">)</span>
<span class="n">plt</span><span class="o">.</span><span class="n">show</span><span class="p">()</span>
</pre></div>

</div>
</div>
</div>

<div class="output_wrapper">
<div class="output">


<div class="output_area">

<div class="prompt"></div>




<div class="output_png output_subarea ">
<img src="data:image/png;base64,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
"
>
</div>

</div>

</div>
</div>

</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<p>You can find further hints for smoothing the plot of an output vector
in the signal processing chapter of the SciPy Cookbook (see References).</p>

</div>
</div>
</div>
<div class="cell border-box-sizing text_cell rendered"><div class="prompt input_prompt">
</div>
<div class="inner_cell">
<div class="text_cell_render border-box-sizing rendered_html">
<h2 id="Resources">Resources<a class="anchor-link" href="#Resources">&#194;&#182;</a></h2><p>The primary and authentic source of information on Pandas, Matplotlib and other
libraries is their official documentation. I do not link them here because they 
are trivial to find via Google. Instead, here is a random collection of other 
resources that I found useful while writing this tutorial (not counting all the 
StackOverflow pages I visited.)</p>
<ul>
<li>Pandas tutorial from Greg Reda: 
<a href="http://www.gregreda.com/2013/10/26/working-with-pandas-dataframes/">http://www.gregreda.com/2013/10/26/working-with-pandas-dataframes/</a></li>
<li>On reshaping data frames: 
<a href="https://pandas.pydata.org/pandas-docs/stable/reshaping.html#reshaping">https://pandas.pydata.org/pandas-docs/stable/reshaping.html#reshaping</a></li>
<li>Matplotlib tutorial of Nicolas P. Rougier:
<a href="https://www.labri.fr/perso/nrougier/teaching/matplotlib/">https://www.labri.fr/perso/nrougier/teaching/matplotlib/</a></li>
<li>Creating boxplots with Matplotlib, from Bharat Bhole:
<a href="http://blog.bharatbhole.com/creating-boxplots-with-matplotlib/">http://blog.bharatbhole.com/creating-boxplots-with-matplotlib/</a></li>
<li>SciPy Cookbook on signal smoothing: 
<a href="http://scipy-cookbook.readthedocs.io/items/SignalSmooth.html">http://scipy-cookbook.readthedocs.io/items/SignalSmooth.html</a></li>
<li>Visual Guide on Pandas (video): 
<a href="https://www.youtube.com/watch?v=9d5-Ti6onew">https://www.youtube.com/watch?v=9d5-Ti6onew</a></li>
<li>Python Pandas Cookbook (videos):
<a href="https://www.youtube.com/playlist?list=PLyBBc46Y6aAz54aOUgKXXyTcEmpMisAq3">https://www.youtube.com/playlist?list=PLyBBc46Y6aAz54aOUgKXXyTcEmpMisAq3</a></li>
</ul>
<h2 id="Acknowledgements">Acknowledgements<a class="anchor-link" href="#Acknowledgements">&#194;&#182;</a></h2><p>I would like to thank the participants of the 2016 OMNeT++ Summit for the 
valuable feedback, and especially Dr Kyeong Soo (Joseph) Kim for bringing
my attention to Pandas and Jupyter.</p>

</div>
</div>
</div>
 

