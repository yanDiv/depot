# Depot.js

#How To Use?
A template engine like mustache.js,so according to the mustache.js document,but depot.js has some different.
simple expressions of calculating support

var tpl = new String( 'Hi,{{ lastName || middleName  }}!How are you?' );

Depot.render( tpl,{
  middleName: 'yanDiv'
});

#How To Exten?
You can according to the depot.extension.js
