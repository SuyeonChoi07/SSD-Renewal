const hand=document.querySelector('.intro-hand-video-stage');
const anchors=window.storyModel?.handVideoAnchors;

if(hand&&anchors){
  const video=hand.querySelector('.intro-hand-video-source');
  const canvas=hand.querySelector('.intro-hand-video-canvas');
  document.querySelector('.design-stage').append(hand);
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true});
  const clamp=value=>Math.max(0,Math.min(1,value));
  const compile=(type,source)=>{
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  };

  if(gl){
    const vertex=compile(gl.VERTEX_SHADER,`
      attribute vec2 position;
      varying vec2 uv;
      void main(){uv=(position+1.0)*0.5;gl_Position=vec4(position,0.0,1.0);}
    `);
    const fragment=compile(gl.FRAGMENT_SHADER,`
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D frame;
      void main(){
        vec4 source=texture2D(frame,uv);
        float greenExcess=source.g-max(source.r,source.b);
        float alpha=1.0-smoothstep(0.08,0.27,greenExcess);
        vec3 color=source.rgb;
        color.g=min(color.g,max(color.r,color.b)*1.08);
        gl_FragColor=vec4(color*alpha,alpha);
      }
    `);
    const program=gl.createProgram();
    gl.attachShader(program,vertex);
    gl.attachShader(program,fragment);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const points=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,points);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const texture=gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program,'frame'),0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.viewport(0,0,canvas.width,canvas.height);

    const draw=()=>{
      if(video.readyState<2)return;
      gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    };
    const update=()=>{
      const y=window.scrollY;
      const introOffset=clamp((y-anchors.introTravelStart)/2040)*2040;
      hand.style.setProperty('--hand-intro-offset',`${introOffset}px`);
      const visible=y>=anchors.first&&y<anchors.third;
      hand.style.visibility=visible?'visible':'hidden';
      if(!visible||!Number.isFinite(video.duration))return;
      const frame15=1.5;
      const end=Math.max(video.duration-1/30,frame15);
      const time=y<anchors.second
        ?frame15*clamp((y-anchors.first)/(anchors.second-anchors.first))
        :y<anchors.reverseStart?frame15
        :frame15+(end-frame15)*clamp((y-anchors.reverseStart)/(anchors.third-anchors.reverseStart));
      if(Math.abs(video.currentTime-time)>1/60)video.currentTime=time;
      else draw();
    };
    video.addEventListener('loadeddata',update);
    video.addEventListener('seeked',draw);
    window.addEventListener('scroll',update,{passive:true});
    fetch(video.dataset.src).then(response=>{
      if(!response.ok)throw new Error(`손 영상 응답: ${response.status}`);
      return response.blob();
    }).then(blob=>{
      video.src=URL.createObjectURL(blob);
      video.load();
    }).catch(error=>console.error('손 영상 로딩 실패:',error));
    update();
  }else{
    console.error('손 영상의 그린스크린 합성을 위한 WebGL을 사용할 수 없습니다.');
  }
}
