type fill_linear  = {
   "type":"fill_linear",
   "x0" : number, 
   "y0" : number, 
   "x1" : number, 
   "y1" : number, 
   "colorstops" : [number , string][]   
}
type fill_radial  = {
   "type":"fill_radial",
   "x0" : number, 
   "y0" : number, 
   "x1" : number, 
   "y1" : number, 
   "r0" : number,
   "r1" : number,
   "colorstops" : [number , string][]   
}

type fill_conic  = {
   "type":"fill_conic",
   "x" : number, 
   "y" : number, 
   "theta" : number,
   "colorstops" : [number , string][]   
}

type fillstyle = string | fill_linear | fill_radial | fill_conic

type bezier = [number, number, number, number, number, number];

// start replacing HERE
type drawImage_command = {
   "type" : "drawImage",
   "img" : string,
   "x" : number,
   "y" : number,
}

type drawLine_command = {
   "type" : "drawLine",
   "x0" : number,
   "y0" : number,
   "x1" : number,
   "y1" : number,
   "color" ?: string,
   "width" ?: number,
}

type drawCircle_command = {
   "type" : "drawCircle",
   "x" : number,
   "y" : number,
   "r" : number,
   "color" ?: fillstyle,
   "width" ?: number,
   "fill" ?: boolean,
   "transparency" ?: number,
   "start" ?: number,
   "end" ?: number,
}

type drawPolygon_command = {
   "type" : "drawPolygon",
   "points_x" : number[],
   "points_y" : number[],
   "color" ?: fillstyle,
   "width" ?: number,
   "fill" ?: boolean,
   "transparency" ?: number,
}

type drawRectangle_command = {
   "type" : "drawRectangle",
   "tlx" : number,
   "tly" : number,
   "brx" : number,
   "bry" : number,
   "color" ?: fillstyle,
   "width" ?: number,
   "fill" ?: boolean,
   "transparency" ?: number,
}

type drawRectangle2_command = {
   "type" : "drawRectangle2",
   "tlx" : number,
   "tly" : number,
   "width" : number,
   "height" : number,
   "color" ?: fillstyle,
   "widthA" ?: number,
   "fill" ?: boolean,
   "transparency" ?: number,
}

type drawText_command = {
   "type" : "drawText",
   "text_" : string,
   "x" : number,
   "y" : number,
   "width" ?: number | undefined,
   "color" ?: string,
   "size" ?: number,
   font ?: string
}

type drawEllipse_command = {
   "type" : "drawEllipse",
   "posx" : number,
   "posy" : number,
   "brx" : number,
   "bry" : number,
   "color" ?: fillstyle,
   "transparency" ?: number,
   "rotate" ?: number,
   "start" ?: number,
   "end" ?: number,
}

type drawEllipseCR_command = {
   "type" : "drawEllipseCR",
   "cx" : number,
   "cy" : number,
   "rx" : number,
   "ry" : number,
   "color" ?: fillstyle,
   "transparency" ?: number,
   "rotate" ?: number,
   "start" ?: number,
   "end" ?: number,
}

type drawEllipse2_command = {
   "type" : "drawEllipse2",
   "posx" : number,
   "posy" : number,
   "width" : number,
   "height" : number,
   "color" ?: fillstyle,
   "transparency" ?: number,
   "rotate" ?: number,
   "start" ?: number,
   "end" ?: number,
}

type drawBezierCurve_command = {
   "type" : "drawBezierCurve",
   "x" : number,
   "y" : number,
   "p1x" : number,
   "p1y" : number,
   "p2x" : number,
   "p2y" : number,
   "p3x" : number,
   "p3y" : number,
   "color" ?: fillstyle,
   "width" ?: number,
}

//start at x,y , each bezier is 
type drawBezierShape_command = {
   "type" : "drawBezierShape",
   "x" : number,
   "y" : number,
   "curves" : bezier[],
   "color" ?: fillstyle,
   "width" ?: number,
}

type drawRoundedRectangle_command = {
   "type" : "drawRoundedRectangle",
   "x0" : number,
   "y0" : number,
   "x1" : number,
   "y1" : number,
   "r1" : number,
   "r2" : number,
   "color" ?: fillstyle,
   "width" ?: number,
   "fill" ?: boolean,
}

type draw_command = drawImage_command|drawLine_command|drawCircle_command|drawPolygon_command|drawRectangle_command|drawRectangle2_command|drawText_command|drawEllipse_command|drawEllipseCR_command|drawEllipse2_command|drawBezierCurve_command|drawBezierShape_command|drawRoundedRectangle_command
