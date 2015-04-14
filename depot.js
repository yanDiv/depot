var Depot = function( global,undefined,Depot ){
		//防止深度查找
	var	array = [],
		object = {},
		toString = object.toString,
		concat = array.concat,
		slice = array.slice,
		primary = random(),
		
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
		Parse,
		Render,
		Cache;

	//模板引擎暴露对象
	Depot = Depot || {
		//版本
		version: '1.0.0',
		//边界符号
		tagName: [ '{{','}}' ],
		//缓冲标志
		cache: true
	};

	Cache = {};

	Parse = {
		rmark: [],
		rstat: [],
		code: function(){
			var code = {
					state: true
				};

			return function( type,callback ){
				if( typeof type == 'function' ){
					return type.call( this,code );
				}

				if( typeof callback == 'function' ){
					return code[ type ] = callback;
				}

				return code[ type ];
			}
		}(),
		tmpl: function( tmpl ){
			var ctx = {
					pieces: [],
					tokens: []
				},
				escp = escape,
				rmk = this.rmark,
				code = this.code,
				tagName = Depot.tagName;

			core.call( ctx,tmpl,function( res,s,m,e,tmpl ){
				var tpl = tmpl,
					holder,
					piece;

				res ?
					( holder = code( res[ 2 ] ) || code( res[ 1 ] ) ) ?
						holder.apply( this,arguments ) : code( '*' ).apply( this,arguments )
					: ( piece = tpl.slice( s,e ) ) ? this.pieces.push( piece ) : false;
			});

			return ctx;

			//内部函数，解析核心函数
			function core( tmpl,callback ){
				var name = tagName,
					es = escp,
					rstr = escp( 'regexp',name[ 0 ] ) + 
						 '\\s*' + 
						 '(?:(\.)|(?:(['+ rmk.join( '' ) +']?)' +
						 '([a-z_A-Z]{1}[\\w_\\/\\|\\.]*)))' + 
						 '\\s*' + 
						 escp( 'regexp',name[ 1 ] ),
					rtp = new RegExp( rstr,'g' ),
					len = tmpl.length,
					record = 0,
					last,
					res;

				res = rtp.exec( tmpl );

				while( res ){
					last = rtp.lastIndex;
					callback.call( this,res,record,res.index,last,tmpl );
					record = last;
					res = rtp.exec( tmpl );
				}

				callback.call( this,res,record,len,len,tmpl );
				rtp.lastIndex = 0;
			}
		}
	}

	//标志解析处理函数哈希表
	Parse.code(function( code ){
		var rtoken = /([a-zA-Z_]{1}[\w_\.]*)|(\.{1})/g,
			slice = [].slice,
			cache = Cache,
			parse = this,
			token,
			x,
			y;

		this.rmark = this.rmark.concat( [ '!','@','#','\/','?',':',] );

		code[ '*' ] = function( res,s,m,e,tmpl ){
			var piece,
				token = res[ 3 ];

			if( !code.state ){
				return;
			}

			if( piece = tmpl.slice( s,m ) ){
				this.pieces.push( piece);
			}

			this.pieces.push( '' );

			this.tokens.push({
				type: res[ 2 ] || '*',
				tpl: cache[ token ] || null,
				tokens: token
			});
		};

		code[ '.' ] = function( res,s,m,e,tmpl ){
			var pieces,
				token = res[ 1 ];

			if( !code.state ){
				return;
			}

			if( piece = tmpl.slice( s,m ) ){
				this.pieces.push( piece );
			}

			this.pieces.push( '' );
			this.tokens.push({
				type: '.',
				tpl: null,
				tokens: token
			});
		}

		code[ '@' ] = function( res ){
			if( !code.state ){
				return;
			}

			code[ '*' ].apply( this,arguments );
		};
		code[ '#' ] = function( res,s,m,e,tmpl ){
			var piece;

			if( !code.state ){
				return;
			}

			if( piece = tmpl.slice( s,m ) ){
				this.pieces.push( piece );
			}

			this.pieces.push( '' );

			x = m;
			y = e;
			token = res[ 3 ];
			code.state = false;
		}
		code[ '/' ] = function( res,s,m,e,tmpl ){
			var piece,
				tpl;

			if( token == res[ 3 ] ){
				tpl = tmpl.slice( y,s );
				if( piece = tmpl.slice( s,m ) ){
					this.pieces.push( piece );
				}

				this.tokens.push({
					type: '#',
					tpl: tpl,
					tokens: token
				});
				x = y = token = undefined;
				code.state = true;
			}
		}		
	});

	//渲染对象
	Render = {
		//渲染模板
		value: function(){
			var value = {};

			return function( type,callback ){
				if( typeof type == 'function' ){
					return type.call( this,value );
				}

				if( typeof callback == 'function' ){
					return value[ type ] = callback;
				}

				return value[ type ];
			}
		}(),
		tmpl: function( ctx,model ){
			var cnt = concat,
				value = this.value,
				pieces = cnt.call( ctx.pieces,[] ),
				tokens = cnt.call( ctx.tokens,[] ),
				cache = {},
				length = pieces.length,
				res;

			if( empty( model ) ){
				return pieces.join( '' );
			}

			while( length-- ){
				if( pieces[ length ] == ''){
					tk = tokens.pop();
					if( res = cache[ tk.type + tk.tokens ] ){
						pieces[ length ] = res;
						continue;
					}
					cache[ tk.type + tk.tokens ] = res = this.value( tk.type ).call( this,tk,tk.tokens,model );
					pieces[ length ] = res;
				}
			}

			return pieces.join('');
		}
	}

	Render.value(function( value ){
		var fn = Function,
			escp = escape,
			cache = Cache,
			parse = Parse,
			isArr = isArray;

		value[ '*' ]  = function( holder,token,model ){
			var val = returnValue.call( model,token ),
				ret = val;

			if( typeof val == 'function' ){
				ret = val.call( this,model );
			}

			return ret === undefined ?
				'' : ret;
		};

		value[ '!' ] = function( holder,token,model ){
			return escp( value[ '*' ].apply( this,arguments ) );
		}

		value[ '.' ] = function( holder,token,model ){
			arguments[ 1 ] = 'content';
			return value[ '*' ].apply( this,arguments );
		}	

		value[ '#' ] = function( holder,token,model ){
			var val = returnValue.call( model,token ),
				arr = isArr( val ),
				tpl = parse.tmpl( holder.tpl ),
				ret = '',
				hold;

			if( val.length < 1 ){
				return ret;
			}

			for( var i = 0,length = val.length; i < length; i++ ){
				hold = val[ i ];

				ret += this.tmpl( tpl, typeof hold == 'object' ? ( hold.index = i,hold ) : {
					content: hold,
					index: i
				});
			}

			return ret;
		}

		value[ '@' ] = function( holder,token,model ){
			var ref = token,
				tpl = cache[ ref ],
				ret;

			if( !tpl ){
				return '';
			}

			return this.tmpl( tpl,model );
		}
			
		function returnValue( item ){
			var item = item.split( '|' ),
				length = item.length,
				token,
				ret;

			if( length == 1){
				return ( fn('try{ return this.' + item[ 0 ] + ';}catch( e ){ return undefined }' ) ).call( this );
			}

			while( length-- ){
				ret = ( fn('try{ return this.' + item[ length ] + ';}catch( e ){ return undefined }' ) ).call( this );

				if( !(ret === undefined) ){
					return ret;
				}
			}

			return ret;
		}

	});

	//对外暴露渲染函数
	Depot.render = function( tpl,model ){
		return Render.tmpl( Depot.parse( tpl ),model );
	}

	Depot.parse = function( tpl ){
		var isCache = this.cache,
			cache = Cache,
			prim = primary,
			name,
			ctx;

		if( isArray( tpl ) ){
			for( var i = 0,length = tpl.length;i < length;i++ ){
				this.parse.apply( this,tpl[ i ] );
			}
		}

		if( isCache ){
			name = namespace( tpl ) + prim;
			ctx = cache[ name ];

			if( !ctx ){
				ctx = cache[ name ] = Parse.tmpl( tpl );
			}
		}

		if( !ctx ){
			ctx = Parse.tmpl( tpl );
		}

		return ctx;
	}

	Depot.destroy = function( tmpl ){
		var cache = Cache,
			key =  tmpl + primary;

		cache[ key ] = undefined;
		delete cache[ key ];

		model.valueOf( true );
	}

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
		var length = 6,
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
		var valueOf = tmpl.valueOf,
			ring = random();

		tmpl.valueOf = function( restore ){
			return restore ? tmpl.valueOf = valueOf : ring;
		}

		return tmpl;
	}

}( Function( 'return this' ),undefined,Depot )