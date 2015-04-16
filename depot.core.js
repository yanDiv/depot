var Depot = function( global,undefined,Depot ){
		//防止深度查找
	var	array = [],
		object = {},
		toString = object.toString,
		concat = array.concat,
		slice = array.slice,
		primary = random(),
		tagName,
		occupying,
		
		//html转义哈希表
		entity = {
			'&' : '&amp;',
			'<' : '&lt;',
			'>' : '&gt;',
			'\'': '&#29;',
			'"' : '&quot;',
			'/' : ''
		},

		//解析，渲染，缓存对象
		Render,
		Cache = {};

	//模板引擎暴露对象
	Depot = Depot || {
		//版本
		version: '1.0.0',
		//边界符号
		tagName: tagName = [ '{{','}}' ],
		//缓冲标志
		cache: true,
		occupying: random()
	};

	ParseClass = function( tpl ){
		this.state = true;
		return this.tmpl( tpl );
	}

	ParseClass.fn = ParseClass.prototype = {
		constructor: ParseClass,
		rsign: [],
		rmark: [],
		method: {},
		tmpl: function( tmpl ){
			var ctx = {
					pieces: [],
					tokens: []
				},
				rmk = this.rmark,
				rsn = this.rsign,
				that = this,
				method = this.method;

			(function( tmpl,handle ){
				var depot = Depot,
					name = depot.tagName,
					occupy = depot.occupying,
					escp = escape,
					rthunk = new RegExp( escp( 'regexp',name[ 0 ] ) + '\\s*(.*?)\\s*' + escp( 'regexp',name[ 1 ] ),'g' ),
					rmark = new RegExp( '^[' + rsn.join('') + ']|(@(' + rmk.join( '|' ) + ')){1}','g' ),
					rtokens = /[<>\d\s\w_\.\|\+\-\?\:%&\(\)\/='"]+|'.*'|".*"/g,
					total = tmpl.length,
					record = 0,
					self = that,
					last,
					mark,
					holder,
					tokens,
					result;

				result = rthunk.exec( tmpl );
				
				while( result ){
					last = rthunk.lastIndex;
					holder = result[ 1 ];

					if( holder == '.' ){
						holder = occupy;
					}
					mark = rmark.exec( holder );
					holder = holder.slice( rmark.lastIndex );

					tokens = rtokens.exec( holder )[ 0 ];

					handle.call( this,{
						mark: mark ? mark[ 0 ] : null,
						tokens: tokens
					},record,result.index,rthunk.lastIndex,tmpl,self );

					record = last;
					result = rthunk.exec( tmpl );
					rmark.lastIndex = 0;
					rtokens.lastIndex = 0;
				}

				handle.call( this,null,record,total,total,tmpl,self );

			}).call( ctx,tmpl,function( result,s,m,e,tmpl,context ){
				var tpl = tmpl,
					holder,
					piece;

				if( result ){
					holder = method[ result.mark ];
					if( holder ){
						return holder.apply( this,arguments )
					}

					return method[ '*' ].apply( this,arguments );
				}

				if( piece = tmpl.slice( s,e ) ){
					this.pieces.push( piece );
				}
			});

			return ctx;
		}
	}

	ParseClass.parse = function( sign,callback ){
		var method = this.fn.method,
			hasOwn = method.hasOwnProperty;

		if( typeof sign == 'object' ){
			for( var k in sign ){
				if( hasOwn.call( sign,k ) ){
					this.parse( k,sign[ k ] );
				}
			}
			return this;
		}

		/^@+/.test( sign ) ?
			this.fn.rmark.push( sign.slice( 1 ) ) : this.fn.rsign.push( sign );

		method[ sign ] = callback;

		return this;
	}

	//渲染对象
	Render = {
		//渲染模板
		method: {},
		parse: function( sign,callback ){
			var method = this.method,
			hasOwn = method.hasOwnProperty;

			if( typeof sign == 'object' ){
				for( var k in sign ){
					if( hasOwn.call( sign,k ) ){
						this.parse( k,sign[ k ] );
					}
				}

				return this;
			}

			method[ sign ] = callback;

			return this;
		},
		tmpl: function( ctx,model ){
			var cnt = concat,
				method = this.method,
				pieces = cnt.call( ctx.pieces,[] ),
				tokens = cnt.call( ctx.tokens,[] ),
				cache = {},
				length = pieces.length,
				res;

			if( empty( model ) ){
				return pieces.join( '' );
			}

			while( length-- ){
				if( pieces[ length ] === undefined ){
					tk = tokens.pop();

					if( res = cache[ tk.mark + tk.tokens ] ){
						pieces[ length ] = res;
						continue;
					}

					cache[ tk.type + tk.tokens ] = res = method[ tk.type ].call( this,tk,tk.tokens,model );
					pieces[ length ] = res;
				}
			}

			return pieces.join('');
		}
	}

	//对外暴露渲染函数
	Depot.render = function( tpl,model ){
		return  tpl instanceof String ?
			Render.tmpl( Depot.parse( tpl ),model ) : '';
	}

	Depot.parse = function( tpl ){
		var key,
			cache = Cache,
			holder;

		key = tpl + primary;

		if( holder = cache[ key ] ){
			return holder;
		}

		key = namespace( tpl ) + primary;

		return holder = cache[ key ] = new ParseClass( tpl );
	}

	Depot.destroy = function( tpl ){
		var key = tpl + primary;

		tpl.valueOf( true );

		delete Cache[ key ];

		return this;
	}

	Depot.renderMethod = function(){
		Render.parse.apply( Render,arguments );

		return this;
	}

	Depot.parseMethod = function(){
		ParseClass.parse.apply( ParseClass,arguments );

		return this;
	}

	Depot.returnValue = function( tokens,model ){
		var rval = /([a-z_A-Z]{1}[\w\.]*)|'.*'|".*"|\d+|[<>\+\-\?\:%&\(\)\/\*\|=]+/g,
			item = [],
			fn = Function,
			word;

		word = rval.exec( tokens );

		while( word ){
			word[ 0 ] == 'undefined' || 
			word[ 0 ] == 'true' ||
			word[ 0 ] == 'false' ||
			word[ 0 ] == 'null' ||
			word[ 0 ] == '>' ||
			word[ 0 ] == '<' ||
			word[ 0 ] == '+' ||
			word[ 0 ] == '-' ||
			word[ 0 ] == '/' ||
			word[ 0 ] == '*' ||
			word[ 0 ] == '&&' ||
			word[ 0 ] == '||' ||
			word[ 0 ] == '(' ||
			word[ 0 ] == ')' ||
			word[ 0 ] == '?' ||
			word[ 0 ] == '==' ||
			word[ 0 ] == '===' ||
			word[ 0 ] == ':' ? 
				item.push( word[ 0 ] ) : 
				word[ 1 ] === undefined ? 
					item.push( word[ 0 ] ) : 
					item.push( 'this.' + word[ 1 ] );
			word = rval.exec( tokens );
		}

		return fn( 'try{ return ('+ item.join('') +'); }catch(e){return undefined}' ).call( model );
	}

	Depot.inhert = inhert;
	Depot.isArray = isArray;
	Depot.extend = extend;

	return Depot;
	
	//工具函数
	function escape( type,string ){
		var ent = entity;

		return type == 'html' ?
			string.replace( /[&<>"'\/"]/g,function( s ){
				return ent[ s ];
			}) : string.replace( /[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&" );
	}

	function empty( object ){
		for( var i in object ){
			return false;
		}
		return true;
	}

	function isArray( array ){
		return toString.call( array ) == '[object Array]';
	}

	function random(){
		var length = 9,
			from = String.fromCharCode,
			parse = parseInt,
			rand = Math.random,
			value = [];

		while( length-- ){
			value.push( parse( rand() * 26 + 65 ) );
		}

		return from.apply( null,value );
	}

	function namespace( tmpl ){
		var old = tmpl.valueOf,
			key = random();
			
		tmpl.valueOf = function( remove ){
			if( !remove ){
				return key;
			}

			tmpl.valueOf = old;
		}	

		return tmpl;
	}

	function extend( dest,source ){
		var has = {}.hasOwnProperty;

		for( var k in source ){
			if( has.call( source,k ) ){
				dest[ k ] = source[ k ];
			}
		}

		return dest;
	}


	function inhert( parent ){
		var fn = function(){};
		fn.prototype = parent.prototype || parent;
		return new fn();
	}

}( Function( 'return this' ),undefined,Depot )