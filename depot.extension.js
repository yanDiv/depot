Depot.parseMethod(function(){
	var ret = {};

	ret[ '*' ] = ret[ '@import' ] = function( tokens,s,m,e,tmpl,ctx ){
		var piece;

		if( !ctx.state ){
			return;
		}

		if( piece = tmpl.slice( s,m ) ){
			this.pieces.push( piece);
		}

		this.pieces.push( undefined );

		this.tokens.push({
			type: tokens.mark || '*',
			tpl: null,
			tokens: tokens.tokens
		});
	}

	return ret;
}());
Depot.parseMethod(function(){
	var ret = {},
		x,
		y,
		token,
		mark;

	ret[ '@each' ] = ret[ '#' ] = function( tokens,s,m,e,tmpl,ctx ){
		var piece;

		if( !ctx.state ){
			return;
		}

		if( piece = tmpl.slice( s,m ) ){
			this.pieces.push( piece );
		}

		this.pieces.push( undefined );

		x = m;
		y = e;
		token = tokens.tokens;
		ctx.state = false;
	};

	ret[ '@endeach' ] = ret[ '\/' ] = function( tokens,s,m,e,tmpl,ctx ){
		var piece,
			tpl;

		if( token == tokens.tokens ){
			tpl = tmpl.slice( y,s );
			if( piece = tmpl.slice( s,m ) ){
				this.pieces.push( piece );
			}

			this.tokens.push({
				type: '@each',
				tpl: new String( tpl ),
				tokens: token
			});
			x = y = token = undefined;
			ctx.state = true;
		}
	} 

	return ret;
}());

Depot.parseMethod(function(){
	var ret = {},
		x,
		y,
		token,
		mark;

	ret[ '@if' ] = function( tokens,s,m,e,tmpl,ctx ){
		var piece;

		if( !ctx.state ){
			return;
		}

		if( piece = tmpl.slice( s,m ) ){
			this.pieces.push( piece );
		}

		this.pieces.push( undefined );

		x = m;
		y = e;
		token = tokens.tokens;
		ctx.state = false;
	};

	ret[ '@endif' ] = ret[ '\/' ] = function( tokens,s,m,e,tmpl,ctx ){
		var piece,
			tpl;

		if( token == tokens.tokens ){
			tpl = tmpl.slice( y,s );
			if( piece = tmpl.slice( s,m ) ){
				this.pieces.push( piece );
			}

			this.tokens.push({
				type: '@each',
				tpl: new String( tpl ),
				tokens: token
			});
			x = y = token = undefined;
			ctx.state = true;
		}
	} 

	return ret;
}());

Depot.renderMethod({
	'*': function( object,tokens,model ){
		var t = Depot.returnValue( tokens,model );

		return typeof t == 'function' ? t.call( model,object ) : Depot.returnValue( tokens,model );
	},
	'@import': function( object,tokens,model ){
		return Depot.render( Depot.returnValue( tokens,model ),model );
	},
	'@each': function( object,tokens,model ){
		var val = Depot.returnValue( tokens,model ),
			isArr = Depot.isArray( val ),
			tpl = object.tpl,
			depot = Depot,
			ret = '',
			holder,
			hold;
			
		if( val.length < 1 ){
			return ret;
		}

		for( var i = 0,length = val.length; i < length; i++ ){
			holder = val[ i ];

			hold = depot.inhert( model );
			hold.i = i;


			typeof holder == 'object' ?
				hold = depot.extend( hold,holder ) : 
				hold[ depot.occupying ] = holder;
			
			ret += depot.render( tpl,hold );
		}

		return ret;
	}
})