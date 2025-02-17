// put this into get_type.py, enter "DONE" (no quotes).

import { add_obj, combine_obj, flatten, flatten_all, noNaN, normalize } from "./lines";



var imgStrings : any = {};

export function make_style(ctx : CanvasRenderingContext2D, style : fillstyle ) : string | CanvasGradient {
	if(typeof(style) == "string"){
		return style;
	}
	if(style.type == "fill_linear"){
		var x = ctx.createLinearGradient(style.x0, style.y0, style.x1, style.y1);
	}
	else if(style.type == "fill_radial"){
		var x = ctx.createRadialGradient(style.x0, style.y0, style.r0, style.x1, style.y1, style.r1);
	}
	else if(style.type == "fill_conic"){
		var x = ctx.createConicGradient(style.theta, style.x, style.y);
	} else{
		throw "1";
	}
	for(var item of style.colorstops){
		x.addColorStop(item[0], item[1]);
	}
	return x; 
}

export function loadImage(img : string){
	if(imgStrings[img] == undefined){
		return new Promise<void>(function(x,y){
			let im = new Image(); 
			im.src = img;
			im.onload = function(){
				imgStrings[img] = im;
				x(); 
			}
		})
	}
}

export function drawImage(context :CanvasRenderingContext2D | undefined, img : string, x : number, y : number) {
	if(imgStrings[img] == undefined){
		console.log("load the image first " + img);
		var im = new Image();
		im.src = img;
		im.onload = function(){
			if(context){
				context.drawImage(im, x, y);
			}
			imgStrings[img] = im; 
		}
	} else {
		var im = imgStrings[img] as HTMLImageElement;
		if(context){
			context.drawImage(im, x, y);
		}
	}
}


 export function drawLine(context :CanvasRenderingContext2D, x0 : number, y0: number, x1: number, y1: number, color :string = "black", width: number = 1) {
	noNaN(arguments as any as any[][]);
    //	////console.log(x0, y0, x1, y1)
    context.strokeStyle = color
    context.lineWidth = width;
    context.beginPath();
    context.stroke();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.stroke();
}

//draws a circle with the given coordinates (as center) and color
 export function drawCircle(context :CanvasRenderingContext2D, x : number, y : number, r : number, color : fillstyle =  "black", width : number = 1, fill : boolean = false, transparency : number =1, start:number = 0 , end :number= 2*Math.PI) {
	noNaN(arguments as any as any[][]);
    //////console.log(x,y,r)
    
    context.lineWidth = width;
    context.beginPath();
    context.arc(x, y, r, start,end);
    if(fill){
	
		context.globalAlpha = transparency;	
		context.fillStyle = make_style(context, color);
		context.fill();
		context.globalAlpha = 1;
	} else {
		context.strokeStyle = make_style(context, color);
		context.stroke();
	}
}

export function drawPolygon(context :CanvasRenderingContext2D, points_x : number[] , points_y  : number[], color : fillstyle = "black", width : number = 1, fill : boolean = false,transparency : number =1){
	noNaN(arguments as any as any[][]);
	noNaN(points_x);
	noNaN(points_y);
	context.lineWidth = width;
	context.beginPath();
	context.moveTo(points_x[0], points_y[0]);
    for(var i=1; i< points_x.length; i++){
		context.lineTo(points_x[i], points_y[i]);
	}
	context.closePath();
    if(fill){
	
		context.globalAlpha = transparency;	
		context.fillStyle = make_style(context, color)
		context.fill();
		context.globalAlpha = 1;
	} else {
		context.strokeStyle = make_style(context, color)
		context.stroke();
	}
	
}


//draws a rectangle with the given coordinates and color
 export function drawRectangle(context :CanvasRenderingContext2D, tlx : number, tly : number, brx : number, bry : number, color : fillstyle =  "black", width : number = 1, fill : boolean = false,  transparency : number =1) {
	noNaN(arguments as any as any[][]);
	if(fill){
		context.globalAlpha = transparency;
		context.fillStyle = make_style(context, color)
    	context.fillRect(tlx, tly, brx - tlx, bry - tly);
		context.globalAlpha = 1;
	}
    else{
		context.lineWidth = width;
		context.strokeStyle = make_style(context, color)
		context.beginPath();
		context.rect(tlx, tly, brx - tlx, bry - tly);
		context.stroke();
	}
}
// uses width and height instead of bottom right coordinates
 export function drawRectangle2(context :CanvasRenderingContext2D, tlx : number, tly : number, width : number, height : number, color : fillstyle =  "black", widthA : number = 1, fill : boolean = false,  transparency : number =1){
	noNaN(arguments as any as any[][]);
	drawRectangle(context, tlx, tly, tlx+width, tly+height, color, widthA, fill,  transparency)
	
}
// coords are bottom left of text
 export function drawText(context :CanvasRenderingContext2D, text_ : string, x : number, y : number, width : number | undefined =undefined, color : string =  "black", size : number= 20, font :string = "Arial") {
	noNaN(arguments as any as any[][]);
    context.font = size + `px ${font}`;
	context.fillStyle = color
	if(width == undefined){
		context.fillText(text_, x,y);
	} else{
		context.fillText(text_, x,y,width);
	}
}

// see drawRectangle
 export function drawEllipse(context :CanvasRenderingContext2D, posx : number, posy : number, brx : number, bry : number ,color : fillstyle="black", transparency : number =1, rotate : number = 0, start :number= 0 , end :number= 2*Math.PI){
	noNaN(arguments as any as any[][]);
	drawEllipse2( context, posx, posy, brx-posx, bry-posy ,color, transparency, rotate, start, end)
}
//draw ellipse with center and radii
 export function drawEllipseCR(context :CanvasRenderingContext2D, cx : number, cy : number, rx : number, ry  : number,color : fillstyle="black", transparency : number =1, rotate : number = 0, start :number= 0 , end :number= 2*Math.PI){
	noNaN(arguments as any as any[][]);
	drawEllipse2(context, cx-rx, cy-ry, 2*rx, 2*ry ,color, transparency, rotate, start, end)
}

 export function drawEllipse2(context :CanvasRenderingContext2D, posx : number, posy : number, width : number, height : number ,color : fillstyle="black", transparency : number =1,rotate : number = 0, start :number= 0 , end :number= 2*Math.PI){
	noNaN(arguments as any as any[][]);
	context.beginPath();
	context.fillStyle=make_style(context, color)
    context.globalAlpha = transparency;
	context.ellipse(posx+width/2, posy+height/2, width/2, height/2,rotate, start, end);
	context.fill();
    context.globalAlpha = 1;
}


export function drawBezierCurve(context :CanvasRenderingContext2D, x : number, y : number, p1x : number, p1y : number, p2x : number, p2y : number, p3x : number, p3y : number, color : fillstyle =  "black", width : number = 1){
	noNaN(arguments as any as any[][]);
    //	////console.log(x0, y0, x1, y1)
    context.strokeStyle = make_style(context,color);
    context.lineWidth = width;
    context.beginPath();
	context.moveTo(x, y);
    context.bezierCurveTo(p1x, p1y, p2x, p2y, p3x, p3y);
    context.stroke();
}

export function drawBezierShape(context :CanvasRenderingContext2D, x : number, y : number, curves : bezier[], color : fillstyle =  "black", width : number = 1){
	noNaN(arguments as any as any[][]);
	for(var item of curves){
		noNaN(item);
	}
	// curves are lists of 6 points 
	context.strokeStyle = make_style(context, color)
	context.beginPath();
	context.moveTo(x, y);
	for (let curve of curves){
		let [a,b,c,d,e,f] = curve
		context.bezierCurveTo(a,b,c,d,e,f);
	}
	context.closePath();
	context.fillStyle=make_style(context, color)
	context.fill();
}

export function drawRoundedRectangle(context :CanvasRenderingContext2D, x0 : number, y0: number, x1: number, y1: number, r1 : number,r2 : number,  color :fillstyle = "black", width: number = 1, fill : boolean = false){
	var perp_vector = [y1-y0, x0-x1] 
	perp_vector = normalize(perp_vector, r1); 
	var perp_vector2 = [y1-y0, x0-x1] 
	perp_vector2 = normalize(perp_vector, r2);
	context.beginPath();
	context.moveTo(x0 + perp_vector[0], y0 + perp_vector[1]); 
	context.lineTo(x1 + perp_vector[0], y1 + perp_vector2[1]); 
	var angle = Math.atan2(perp_vector[1], perp_vector[0]);
	// add pi/2 and see if it points in the same direction as p1 -> p0 
	var ccw = Math.cos(angle + Math.PI/2) * (x0-x1) +  Math.sin(angle + Math.PI/2) * (y0-y1) > 0 ;
	context.arc(x1, y1, r2, angle, angle + Math.PI, ccw); 
	context.lineTo(x0 - perp_vector[0], y0- perp_vector[1]);
	context.arc(x0, y0, r1,Math.PI+ angle, angle, ccw); 
	context.closePath();
	if(fill){
		context.fillStyle= make_style(context, color);
		context.fill() 
	} else { 
		context.strokeStyle=make_style(context, color), 
		context.lineWidth = width;
		context.stroke();
	}
} 


// QUICKLY make stuff 

export function d_rect(...args : (number | number[])[] ) : drawRectangle_command{
	let x = flatten_all(args) as number[] ;
	if(x.length != 4){
		throw "draw Rectangle without enough arguments"
	}
	return {"type":"drawRectangle", "tlx" : x[0], "tly" : x[1], "brx" : x[2], "bry" : x[3]}

} 

export function d_rect2(...args : (number | number[])[] ) : drawRectangle2_command{
	let x = flatten_all(args) as number[] ;
	if(x.length != 4){
		throw "draw Rectangle 2 without enough arguments"
	}
	return {"type":"drawRectangle2", "tlx" : x[0], "tly" : x[1], "width" : x[2], "height" : x[3]}
} 

export function d_ellipse(...args : (number | number[])[] ) : drawEllipse_command{
	let x = flatten_all(args) as number[] ;
	if(x.length != 4){
		throw "draw ellipse without enough arguments"
	}
	return {"type":"drawEllipse", "posx" : x[0], "posy" : x[1], "brx" : x[2], "bry" : x[3]}

} 

export function d_ellipse2(...args : (number | number[])[] ) : drawEllipseCR_command{
	let x = flatten_all(args) as number[] ;
	if(x.length != 4){
		throw "draw ellipse 2 without enough arguments"
	}
	return {"type":"drawEllipseCR", "cx" : x[0], "cy" : x[1], "rx" : x[2], "ry" : x[3]}
} 



export function d_line(...args : (number | number[])[] ) : drawLine_command{
	let x = flatten_all(args) as number[] ;
	if(x.length != 4){
		throw "draw line without enough arguments"
	}
	return {"type":"drawLine", "x0" : x[0], "y0" : x[1], "x1" : x[2], "y1" : x[3]}
} 


export function d_circle(...args : (number | number[])[] ) : drawCircle_command{
	let x = flatten_all(args) as number[] ;
	if(x.length != 3){
		throw "draw circle without enough arguments"
	}
	return {"type":"drawCircle", "x" : x[0], "y" : x[1], "r" : x[2]}
} 

export function d_image(name : string , ...args : ( number | number[])[] ) : drawImage_command{
	let x = flatten_all(args) as number[] ;
	if(x.length != 2){
		throw "draw image without enough arguments"
	}
	return {"type":"drawImage", "x" : x[0], "y" : x[1], "img" : name};
} 


export function d_text(text : string , ...args : ( number | number[])[] ) : drawText_command{
	let x = flatten_all(args) as number[] ;
	if(x.length != 2){
		throw "draw text without enough arguments"
	}
	return {"type":"drawText", "x" : x[0], "y" : x[1], "text_" : text};
} 


export function add_com(x : draw_command, y : Record<string, any>) : draw_command{
	combine_obj(x,y); // calls lines.ts 
	return x; 
}
 

