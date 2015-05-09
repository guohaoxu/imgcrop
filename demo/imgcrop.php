<?php
if($_POST){
	$x1 = $_POST[x1];
	$y1 = $_POST[y1];
	$WH = $_POST[WH];
	$imgSrc = $_POST[imgSrc];

	$new=imagecreatetruecolor(100, 100);
	$img=imagecreatefromjpeg($imgSrc);

	imagecopyresampled($new, $img, 0, 0, $x1, $y1, 100, 100, $WH, $WH);

	imagejpeg($new, "./avatar.jpg", 90);
	imagedestroy($new);
	imagedestroy($img);
	
	echo "haha~ You got it!";
}

/*
bool imagecopyresampled ( resource $dst_image , resource $src_image , int $dst_x , int $dst_y , int $src_x , int $src_y , int $dst_w , int $dst_h , int $src_w , int $src_h )
*/

?>
