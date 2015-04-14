# Depot.js

#How To Use?
A template engine like mustache.js,so according to the mustache.js document,but depot.js has some different.

var tpl = new String( 'Hi,{{ lastName || middleName  }}!How are you?' );

depot.render( tpl,{
  middleName: 'yanDiv'
});

#How To Exten?
You can according to the depot.extension.js
