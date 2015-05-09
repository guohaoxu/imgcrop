#imgcrop
```javascript
$(".demo-2 .ic img").imgcrop({
	init: true,
	views: [
		{
			view: ".demo-2 .view img", 
			view_WH: 100
		}
	],
	onSelectChange: function () {
		console.log("onSelectChange...");
		console.log("x1:" + $(".demo-2 .ic img").data("imgcrop_x1"));
		console.log("y1:" + $(".demo-2 .ic img").data("imgcrop_y1"));
		console.log("x2:" + $(".demo-2 .ic img").data("imgcrop_x2"));
		console.log("y2:" + $(".demo-2 .ic img").data("imgcrop_y2"));
		console.log("WH:" + $(".demo-2 .ic img").data("imgcrop_WH"));
	},
	onSelectEnd: function () {
		console.log("onSelectEnd...");
	}
});
```
![](demo-1.jpg)