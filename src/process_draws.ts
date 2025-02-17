import { drawImage, drawLine, drawCircle, drawPolygon, drawRectangle, drawRectangle2, drawText, drawEllipse, drawEllipseCR, drawEllipse2, drawBezierCurve, drawBezierShape, drawRoundedRectangle } from "./canvasDrawing";

export function draw(lst : draw_command[], c: React.RefObject<HTMLCanvasElement>){
    if(c.current == null){
        return;
    }
    //@ts-ignore
    draw_wrap(lst, c.current.getContext('2d'));
}
export function clear(c: React.RefObject<HTMLCanvasElement>){
    if(c.current == null){
        return;
    }
    //@ts-ignore
    c.current.getContext('2d').clearRect(0, 0, c.current?.width, c.current?.height);
}
export function draw_wrap(lst : draw_command[], c: CanvasRenderingContext2D){
    for (let item of lst){
        switch(item.type){
            case "drawImage":
                drawImage(c, item.img,item.x,item.y);
            break;
            case "drawLine":
                drawLine(c, item.x0,item.y0,item.x1,item.y1,item.color,item.width);
            break;
            case "drawCircle":
                drawCircle(c, item.x,item.y,item.r,item.color,item.width,item.fill,item.transparency,item.start,item.end);
            break;
            case "drawPolygon":
                drawPolygon(c, item.points_x,item.points_y,item.color,item.width,item.fill,item.transparency);
            break;
            case "drawRectangle":
                drawRectangle(c, item.tlx,item.tly,item.brx,item.bry,item.color,item.width,item.fill,item.transparency);
            break;
            case "drawRectangle2":
                drawRectangle2(c, item.tlx,item.tly,item.width,item.height,item.color,item.widthA,item.fill,item.transparency);
            break;
            case "drawText":
                drawText(c, item.text_,item.x,item.y,item.width,item.color,item.size, item.font);
            break;
            case "drawEllipse":
                drawEllipse(c, item.posx,item.posy,item.brx,item.bry,item.color,item.transparency,item.rotate,item.start,item.end);
            break;
            case "drawEllipseCR":
                drawEllipseCR(c, item.cx,item.cy,item.rx,item.ry,item.color,item.transparency,item.rotate,item.start,item.end);
            break;
            case "drawEllipse2":
                drawEllipse2(c, item.posx,item.posy,item.width,item.height,item.color,item.transparency,item.rotate,item.start,item.end);
            break;
            case "drawBezierCurve":
                drawBezierCurve(c, item.x,item.y,item.p1x,item.p1y,item.p2x,item.p2y,item.p3x,item.p3y,item.color,item.width);
            break;
            case "drawBezierShape":
                drawBezierShape(c, item.x,item.y,item.curves,item.color,item.width);
            break;
            case "drawRoundedRectangle":
                drawRoundedRectangle(c, item.x0,item.y0,item.x1,item.y1,item.r1, item.r2,item.color,item.width,item.fill);
            break;

        }
    }
}


export class img_with_center{
	commands : draw_command[];
	x : number;
	y : number;
	img : string;
	constructor(commands : draw_command[], x : number, y : number, width : number, height : number ) {
		this.commands = commands;
		this.x = x;
		this.y = y; 
		this.img = save_image(commands, width, height)
	}
	output(x : number , y : number) : draw_command{
		return {type:"drawImage", x : x-this.x, y:y-this.y, img:this.img};
	}
}

export function save_image(commands : draw_command[] , width : number, height : number) : string  {
	var c = document.createElement("canvas");
	c.setAttribute("width", width.toString());
	c.setAttribute("height", height.toString());
	var ctx = c.getContext("2d") ;
    if(ctx == null){
        throw 1;
    }
	draw_wrap(commands, ctx);
	return c.toDataURL('image/png');
}

