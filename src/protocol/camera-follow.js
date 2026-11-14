/**
 * Keep camera target ownership explicit when server entities despawn.
 * The helper is Phaser-independent so its lifecycle can be tested in Node.
 */
export function setCameraFollowTarget(camera,target,followArgs=[]){
  if(!camera)throw new TypeError("Camera is required");
  if(target)camera.startFollow(target,...followArgs);
  else camera.stopFollow();
  return camera;
}
