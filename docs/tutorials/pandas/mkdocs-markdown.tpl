---
previous_page_disabled: true
next_page_disabled: true
---

{% extends 'display_priority.tpl' %}


{% block in_prompt %}
<div class="input-prompt">In[{{ cell.execution_count }}]:</div>
{% endblock in_prompt %}

{% block output_prompt %}
<div class="output-prompt">Out[{{ cell.execution_count }}]:</div>
{%- endblock output_prompt %}

{% block input %}
```python
{{ cell.source}}
```
{% endblock input %}

{% block outputs %}
{{ super () }}
{% endblock outputs %}

{% block error %}
{{ super() }}
{% endblock error %}

{% block traceback_line %}
{{ line | indent | strip_ansi }}
{% endblock traceback_line %}

{% block execute_result %}

{% block data_priority scoped %}
{{ super() }}
{% endblock %}
{% endblock execute_result %}

{% block stream %}
{{ output.text | indent }}
{% endblock stream %}

{% block data_svg %}
![svg]({{ output.metadata.filenames['image/svg+xml'] | path2url }})
{% endblock data_svg %}

{% block data_png %}
![png]({{ output.data | data2uri(data_type='png') }})
{% endblock data_png %}

{% block data_jpg %}
![jpeg]({{ output.metadata.filenames['image/jpeg'] | path2url }})
{% endblock data_jpg %}

{% block data_latex %}
{{ output.data['text/latex'] }}
{% endblock data_latex %}

{% block data_html scoped %}
<div class="output-html">
{{ output.data['text/html'] }}
</div>
{% endblock data_html %}

{% block data_markdown scoped %}
{{ output.data['text/markdown'] }}
{% endblock data_markdown %}

{% block data_text scoped %}
{{ output.data['text/plain'] | indent }}
{% endblock data_text %}

{% block markdowncell scoped %}
{{ cell.source }}
{% endblock markdowncell %}

{% block unknowncell scoped %}
unknown type  {{ cell.type }}
{% endblock unknowncell %}
