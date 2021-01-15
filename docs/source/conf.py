import sys
import os

project = 'Ethereum Mars'
copyright = '2020 Ethworks sp z o.o.'
author = 'Piotr Szlachciak'

templates_path = ['_templates']
exclude_patterns = []

extensions = ['sphinx.ext.autosectionlabel']

html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']
html_css_files = ['custom.css']
html_favicon = '_static/favicon.png'
html_logo = '_static/mars-logo.svg'
html_theme_options = {
  'logo_only': True,
}

sys.path.insert(0, os.path.abspath('../../packages/example'))
