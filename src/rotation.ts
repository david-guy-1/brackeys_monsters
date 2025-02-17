import { point } from "./interfaces";

export function rotate(p : point, origin : point, amt : number) : point {  // clockwise rotation programming convention, ccw math convention
    var dx = p[0] - origin[0];
    var dy = p[1] - origin[1];
    var r = Math.sqrt(dx*dx + dy*dy);
    var theta = Math.atan2(dy,dx);
    theta += amt; 
    return [r * Math.cos(theta) + origin[0], r * Math.sin(theta) + origin[1]];
}

export function displace_fillstyle(style : fillstyle, amt : point ) : fillstyle {
    
    var x = JSON.parse(JSON.stringify(style)) as fillstyle;
    if(typeof(x) == "string"){
        return x;
    }

    switch(x.type){
        case "fill_conic":
            x.x += amt[0];
            x.y += amt[1];
        break;
        case "fill_linear":
        case "fill_radial":
            x.x1 += amt[0];
            x.y1 += amt[1];
            x.x0 += amt[0];
            x.y0 += amt[1];
        break;
    }
    return x; 
}
export function rotate_fillstyle(style : fillstyle,origin : point, amt : number) : fillstyle {
    var x = JSON.parse(JSON.stringify(style)) as fillstyle;
    if(typeof(x) == "string"){
        return x;
    }

    switch(x.type){
        case "fill_conic":
            [x.x, x.y]  = rotate([x.x, x.y], origin, amt);
            style;
            x.theta += amt; 
        break;
        case "fill_linear":
        case "fill_radial":
            [x.x1, x.y1]  = rotate([x.x1, x.y1], origin, amt);
            [x.x0, x.y0]  = rotate([x.x0, x.y0], origin, amt);      
        break;
    }
    return x; 
}
export function scale_fillstyle(style : fillstyle,center : point, x_amt : number, y_amt : number) : fillstyle {
    var x = JSON.parse(JSON.stringify(style)) as fillstyle;
    if(typeof(x) == "string"){
        return x;
    }

    switch(x.type){
        case "fill_conic":
            x.x = scale_number(x.x, center[0], x_amt);
            x.y = scale_number(x.y, center[1], y_amt);
        break;
        case "fill_radial":
            if(x_amt != y_amt){
                throw "scaling fill_radial with non-uniform scaling"
            }
            x.r0 *= x_amt;
            x.r1 *= x_amt;
            // fall through
        case "fill_linear":
            x.x0 = scale_number(x.x0, center[0], x_amt);
            x.x1 = scale_number(x.x1, center[0], x_amt);
            x.y0 = scale_number(x.y0, center[1], y_amt);
            x.y1 = scale_number(x.y1, center[1], y_amt);
        break;
    }
    return x; 
}
export function displace_command(command : draw_command, amt : point) : draw_command {
    var new_command : draw_command = JSON.parse(JSON.stringify(command)); // copy it
    switch(new_command.type){
        case "drawCircle":
        case "drawPolygon":
        case "drawRectangle":
        case "drawRectangle2":
        case "drawEllipse":
        case "drawEllipseCR":
        case "drawEllipse2":
        case "drawBezierCurve":
        case "drawBezierShape":
        case "drawRoundedRectangle":
        if(new_command.color){
            new_command.color = displace_fillstyle(new_command.color, amt);
        }
    }
    switch(command.type){
        case "drawBezierCurve":
            new_command = new_command as drawBezierCurve_command;
            new_command.x+= amt[0] 
            new_command.p1x+= amt[0] 
            new_command.p2x+= amt[0] 
            new_command.p3x+= amt[0] 
            new_command.y+= amt[1] 
            new_command.p1y+= amt[1] 
            new_command.p2y+= amt[1] 
            new_command.p3y+= amt[1] 
        break;
        case "drawImage":
            new_command = new_command as drawImage_command;
            new_command.x+= amt[0] 
            new_command.y+= amt[1] 
        break;
        case "drawBezierShape":
            new_command = new_command as drawBezierShape_command; 
            new_command.x+= amt[0] 
            new_command.y+= amt[1] 
            for(var curve of new_command.curves){
                for(var i=0;i<6;i++){
                    curve[i] += amt[i%2]; 
                }
            }
        break;
        case "drawCircle":
            new_command = new_command as drawCircle_command;
            new_command.x+= amt[0] 
            new_command.y+= amt[1] 
        break;
        case "drawEllipse": // all ellipses are converted into CR format 
            new_command = new_command as drawEllipse_command;
            new_command.posx += amt[0];
            new_command.posy += amt[1];
            new_command.brx += amt[0];
            new_command.bry += amt[1];
        break;
        case "drawEllipse2":
            new_command = new_command as drawEllipse2_command;
            new_command.posx += amt[0];
            new_command.posy += amt[1];
        break;
        case "drawEllipseCR":
            new_command = new_command as drawEllipseCR_command;
            new_command.cx += amt[0];
            new_command.cy += amt[1];
        break;
        case "drawRoundedRectangle":
        case "drawLine":
            new_command = new_command as drawLine_command; 
            new_command.x0 += amt[0];
            new_command.x1 += amt[0];
            new_command.y0 += amt[1];
            new_command.y1 += amt[1];
        break;
        case "drawPolygon":
            new_command = new_command as drawPolygon_command; 
            new_command.points_x = new_command.points_x.map((x) => x+amt[0]); 
            new_command.points_y = new_command.points_y.map((x) => x+amt[1]);
        break;
        case "drawRectangle":
            new_command = new_command as drawRectangle_command; 
            new_command.brx += amt[0];
            new_command.bry += amt[1];
            new_command.tlx += amt[0];
            new_command.tly += amt[1];
        break;
        case "drawRectangle2":
            new_command = new_command as drawRectangle2_command; 
            new_command.tlx += amt[0];
            new_command.tly += amt[1];
        break;

    }
    return new_command; 
}
export function scale_number(number : number, center : number, factor:number ): number{
    return (number - center) * factor + center; 
}

export function scale_command(command : draw_command, center : point, x_amt : number, y_amt : number) : draw_command {
    var new_command : draw_command = JSON.parse(JSON.stringify(command)); // copy it
    switch(new_command.type){
        case "drawCircle":
        case "drawPolygon":
        case "drawRectangle":
        case "drawRectangle2":
        case "drawEllipse":
        case "drawEllipseCR":
        case "drawEllipse2":
        case "drawBezierCurve":
        case "drawBezierShape":
        case "drawRoundedRectangle":
        if(new_command.color){
            new_command.color = scale_fillstyle(new_command.color, center, x_amt, y_amt);
        }
    }
    switch(command.type){
        case "drawBezierCurve":
            new_command = new_command as drawBezierCurve_command;
            new_command.x = scale_number(new_command.x, center[0], x_amt)
            new_command.p1x= scale_number(new_command.p1x, center[0], x_amt)
            new_command.p2x= scale_number(new_command.p2x, center[0], x_amt)
            new_command.p3x= scale_number(new_command.p3x, center[0], x_amt)
            new_command.y = scale_number(new_command.y, center[1], y_amt)
            new_command.p1y= scale_number(new_command.p1y, center[1], y_amt)
            new_command.p2y= scale_number(new_command.p2y, center[1], y_amt)
            new_command.p3y= scale_number(new_command.p3y, center[1], y_amt)
        break;
        case "drawBezierShape":
            new_command = new_command as drawBezierShape_command; 
            new_command.x = scale_number(new_command.x, center[0], x_amt)
            new_command.y = scale_number(new_command.y, center[1], y_amt)
            for(var curve of new_command.curves){
                for(var i=0;i<6;i++){
                    if(i%2 == 0){
                        curve[i] = scale_number(curve[i], center[0], x_amt)
                    } else {
                        curve[i] = scale_number(curve[i], center[1], y_amt)
                    }
                }
            }
        break;
        case "drawCircle": // converted into drawEllipse
            var command_c : draw_command = {type:"drawEllipseCR", cx  : command.x, cy : command.y , rx : command.r, ry : command.r, color : command.color, transparency : command.transparency, start : command.start, end : command.end }
            return scale_command(command_c, center, x_amt, y_amt);
        break;
        case "drawEllipse": // all ellipses are converted into CR format 
            var rx = (command.brx - command.posx)/2
            var ry = (command.bry - command.posy)/2
            var centerE :point = [command.posx + rx,command.posy + ry]; 
            return scale_command({type:"drawEllipseCR", cx  : centerE[0], cy : centerE[1] , rx : rx, ry : ry, color : command.color, transparency : command.transparency, rotate : command.rotate, start : command.start, end : command.end }, center, x_amt, y_amt) // check the last 3 
        break;
        case "drawEllipse2":
            var rx = command.width /2
            var ry = command.height/2
            var centerE :point = [command.posx + rx,command.posy + ry]; 
            return scale_command({type:"drawEllipseCR", cx  : centerE[0], cy : centerE[1] , rx : rx, ry : ry, color : command.color, transparency : command.transparency, rotate : command.rotate, start : command.start, end : command.end },  center, x_amt, y_amt) 
        break;
        case "drawEllipseCR":
            new_command = new_command as drawEllipseCR_command; 
            new_command.cx = scale_number(new_command.cx, center[0], x_amt)
            new_command.cy = scale_number(new_command.cy, center[1], y_amt)
            new_command.rx *= Math.abs(x_amt);
            new_command.ry *= Math.abs(y_amt);
        break;        
        case "drawRoundedRectangle":
            new_command = new_command as drawRoundedRectangle_command
            new_command.r1 *= x_amt;
            new_command.r2 *= x_amt;
            //fall through
        case "drawLine":
            new_command = new_command as drawLine_command; 
            new_command.x0 =scale_number(new_command.x0, center[0], x_amt)
            new_command.x1 =scale_number(new_command.x1, center[0], x_amt)
            new_command.y0 =scale_number(new_command.y0, center[1], y_amt)
            new_command.y1 =scale_number(new_command.y1, center[1], y_amt)
        break;
        case "drawPolygon":
            new_command = new_command as drawPolygon_command; 
            new_command.points_x = new_command.points_x.map((x) => scale_number(x, center[0], x_amt)); 
            new_command.points_y = new_command.points_y.map((x) => scale_number(x, center[1], y_amt));
        break;
        case "drawRectangle":
            new_command = new_command as drawRectangle_command; 
            new_command.brx =scale_number(new_command.brx, center[0], x_amt)
            new_command.bry =scale_number(new_command.bry, center[1], y_amt)
            new_command.tlx =scale_number(new_command.tlx, center[0], x_amt)
            new_command.tly = scale_number(new_command.tly, center[1], y_amt);
        break;
        case "drawRectangle2":
            new_command = new_command as drawRectangle2_command; 
            new_command.tlx =scale_number(new_command.tlx, center[0], x_amt)
            new_command.tly = scale_number(new_command.tly, center[1], y_amt);
            new_command.width *= x_amt;
            new_command.height *= y_amt;
        break;
    }
    return new_command; 
}

export function rotate_command(command : draw_command, origin : point, amt : number) : draw_command{
    var new_command : draw_command = JSON.parse(JSON.stringify(command)); // copy it
    switch(new_command.type){
        case "drawCircle":
        case "drawPolygon":
        case "drawRectangle":
        case "drawRectangle2":
        case "drawEllipse":
        case "drawEllipseCR":
        case "drawEllipse2":
        case "drawBezierCurve":
        case "drawBezierShape":
        case "drawRoundedRectangle":
        if(new_command.color){
            new_command.color = rotate_fillstyle(new_command.color, origin, amt);
        }
    }
    switch(command.type){
        case "drawBezierCurve":
            new_command = new_command as drawBezierCurve_command;
            [new_command.x,new_command.y] = rotate([command.x, command.y], origin, amt); 
            [new_command.p1x,new_command.p1y] = rotate([command.p1x, command.p1y], origin, amt); 
            [new_command.p2x,new_command.p2y] = rotate([command.p2x, command.p2y], origin, amt); 
            [new_command.p3x,new_command.p3y] = rotate([command.p3x, command.p3y], origin, amt); 
        break;
        case "drawBezierShape":
            new_command = new_command as drawBezierShape_command; 
            [new_command.x,new_command.y] = rotate([command.x, command.y], origin, amt); 
            new_command.curves = [];
            for(var curve of command.curves){
                var p1:point = [curve[0],curve[1]] ;
                var p2:point = [curve[2],curve[3]] ;
                var p3:point = [curve[4],curve[5]] ;
                var q1:point = rotate(p1, origin, amt);
                var q2:point = rotate(p2, origin, amt);
                var q3:point = rotate(p3, origin, amt);
                new_command.curves.push([q1[0], q1[1], q2[0], q2[1], q3[0], q3[1]]) ;
            }
        break;
        case "drawCircle":
            new_command = new_command as drawCircle_command;
            [new_command.x,new_command.y] = rotate([command.x, command.y], origin, amt); 
        break;
        case "drawEllipse": // all ellipses are converted into CR format 
            var rx = (command.brx - command.posx)/2
            var ry = (command.bry - command.posy)/2
            var center :point = [command.posx + rx,command.posy + ry]; 
            return rotate_command({type:"drawEllipseCR", cx  : center[0], cy : center[1] , rx : rx, ry : ry, color : command.color, transparency : command.transparency, rotate : command.rotate, start : command.start, end : command.end }, origin, amt) // check the last 3 
        break;
        case "drawEllipse2":
            var rx = command.width /2
            var ry = command.height/2
            var center :point = [command.posx + rx,command.posy + ry]; 
            return rotate_command({type:"drawEllipseCR", cx  : center[0], cy : center[1] , rx : rx, ry : ry, color : command.color, transparency : command.transparency, rotate : command.rotate, start : command.start, end : command.end }, origin, amt) 
        break;
        case "drawEllipseCR":
            new_command = new_command as drawEllipseCR_command; 
            [new_command.cx,new_command.cy] = rotate([command.cx, command.cy], origin, amt); 
            if(new_command.rotate == undefined){
                new_command.rotate = 0;
            }
            new_command.rotate += amt; 
            // check this one, and also if we need to change some others 
        break;
        case "drawRoundedRectangle":
        case "drawLine":
            new_command = new_command as drawLine_command; 
            [new_command.x0,new_command.y0] = rotate([command.x0, command.y0], origin, amt); 
            [new_command.x1,new_command.y1] = rotate([command.x1, command.y1], origin, amt); 
        break;
        case "drawPolygon":
            new_command = new_command as drawPolygon_command; 
            new_command.points_x = [];
            new_command.points_y = [];
            for(var i=0; i<command.points_x.length; i++){
                var next_point = rotate([command.points_x[i],command.points_y[i]], origin, amt );
                new_command.points_x.push(next_point[0]);
                new_command.points_y.push(next_point[1]);
            }
        break;
        case "drawRectangle":
            new_command = new_command as drawRectangle_command; 
            return rotate_command({"type":"drawPolygon","color": command.color, "fill":command.fill, "transparency":command.transparency, "width":command.width, points_x : [command.tlx, command.tlx, command.brx, command.brx], points_y : [command.tly, command.bry,command.bry, command.tly]}, origin, amt);
        break;
        case "drawRectangle2":
            new_command = new_command as drawRectangle2_command; 
            return rotate_command({"type":"drawPolygon","color": command.color, "fill":command.fill, "transparency":command.transparency, "width":command.width, points_x : [command.tlx, command.tlx, command.tlx + command.width, command.tlx + command.width], points_y : [command.tly, command.tlx + command.height,command.tlx + command.height, command.tly]}, origin, amt);
        break;
    }
    return new_command; 
}

