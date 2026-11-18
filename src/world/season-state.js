export const clamp01 = value => Math.max(0, Math.min(1, value));
export function smooth(a, b, value) {
  const t = clamp01((value - a) / (b - a));
  return t * t * (3 - 2 * t);
}

const BASE_BUILD_DISTANCE = 330;
const BASE_WEATHER_DISTANCE = 900;
export const HOUSE_EXTRA_DISTANCE = 150;
export const WINTER_EXTRA_DISTANCE = 180;
export const HOUSE_START = .84, HOUSE_END = .98;
export const FISHING_START = .925, FISHING_END = .995;
export const BUILD_DISTANCE = BASE_BUILD_DISTANCE + HOUSE_EXTRA_DISTANCE;
export const WEATHER_DISTANCE = BASE_WEATHER_DISTANCE + WINTER_EXTRA_DISTANCE;
export const EXIT_DISTANCE = 180;
export const JOURNEY_DISTANCE = BUILD_DISTANCE + WEATHER_DISTANCE + EXIT_DISTANCE;
export const BUILD_END = BUILD_DISTANCE / JOURNEY_DISTANCE;
function distanceAt(progress,base,extra,start,end) {
  const p=clamp01(progress);
  return base*p+extra*clamp01((p-start)/(end-start));
}
function progressAt(distance,base,extra,start,end) {
  const a=base*start,b=base*end+extra;
  if(distance<a)return clamp01(distance/base);
  if(distance>b)return clamp01((distance-extra)/base);
  return start+(distance-a)/(base+extra/(end-start));
}
export const buildDistanceAt=p=>distanceAt(p,BASE_BUILD_DISTANCE,HOUSE_EXTRA_DISTANCE,HOUSE_START,HOUSE_END);
export const weatherDistanceAt=p=>distanceAt(p,BASE_WEATHER_DISTANCE,WINTER_EXTRA_DISTANCE,FISHING_START,FISHING_END);
export const fishingProgress=weather=>clamp01((weather-FISHING_START)/(FISHING_END-FISHING_START));
export function showcaseJourney(progress) {
  const distance = progress * JOURNEY_DISTANCE;
  return { build: progressAt(distance,BASE_BUILD_DISTANCE,HOUSE_EXTRA_DISTANCE,HOUSE_START,HOUSE_END), weather: progressAt(distance-BUILD_DISTANCE,BASE_WEATHER_DISTANCE,WINTER_EXTRA_DISTANCE,FISHING_START,FISHING_END), exit: clamp01((distance - BUILD_DISTANCE - WEATHER_DISTANCE) / EXIT_DISTANCE) };
}

export function seasonState(progress) {
  const p = clamp01(progress);
  const dusk = smooth(0, .12, p);
  const autumn = smooth(.445, .505, p);
  const winter = smooth(.765, .825, p);
  const rain = smooth(.10, .20, p) * (1 - autumn);
  const curtain = p < .34 ? { start: .02, end: .27, kind: 'rain' }
    : p < .66 ? { start: .35, end: .60, kind: 'autumn' }
    : { start: .67, end: .92, kind: 'winter' };
  const cloud = clamp01((p - curtain.start) / (curtain.end - curtain.start));
  const theme = p < .145 ? 'life' : p < .475 ? 'rain' : p < .795 ? 'autumn' : 'winter';
  return {
    p, dusk, autumn, winter, rain, cloud, cloudKind: curtain.kind,
    cloudsVisible: cloud > 0 && cloud < 1,
    theme, many: p >= .145,
    weights: [1 - dusk, dusk * (1 - autumn), autumn * (1 - winter), winter],
    warmth: (rain + autumn * .55 * (1 - winter) + winter * .95),
  };
}

export function houseWalk(build) {
  const t = smooth(HOUSE_START, HOUSE_END, build);
  const points = [[-.16,-.31],[.31,-.27],[.34,.26],[.12,.36],[.064,.20]];
  const segment = Math.min(3, Math.floor(t * 4)), local = Math.min(1, t * 4 - segment);
  const a = points[segment], b = points[segment + 1];
  return { t, x: a[0] + (b[0] - a[0]) * local, z: a[1] + (b[1] - a[1]) * local,
    hop: Math.abs(Math.sin(t * Math.PI * 9)) * .048 * (1 - smooth(.91,.99,t)),
    scale: 1 - smooth(.91,1,t), door: smooth(.72,.82,t) * (1 - smooth(.98,1,build)),
    yaw: Math.atan2(b[0]-a[0],b[1]-a[1]), back: t < .27 };
}

export function fishingStory(progress) {
  const p=clamp01(progress);
  const jumpT=clamp01((p-.31)/.22);
  return {
    alarm:smooth(.16,.22,p)*(1-smooth(.46,.54,p)),
    jump:jumpT>0&&jumpT<1?Math.sin(jumpT*Math.PI)*.19:0,
    dropped:smooth(.40,.66,p),
    surprise:smooth(.28,.33,p)*(1-smooth(.60,.72,p)),
    retrieve:0,
    phase:p<.18?'fishing':p<.31?'ripple':p<.55?'startled':'dropped',
  };
}

export const FISHING_ROD_TIP=[.015,.45,.065];
export function fishingRodPose(dropped) {
  const d=clamp01(dropped),roll=.9;
  // Align the bent tip to the ice plane rather than rotating it below the ice.
  const restTilt=Math.atan2(FISHING_ROD_TIP[0]*Math.sin(roll)+FISHING_ROD_TIP[1]*Math.cos(roll),FISHING_ROD_TIP[2]);
  return {x:.04+d*.06,y:.34-d*.162,z:-.11-d*.17,tilt:.5+d*(restTilt-.5),roll:-.65+d*(roll+.65)};
}

export function lightningPulse(time) {
  const t = ((time % 12.6) + 12.6) % 12.6;
  return Math.max(0,1-Math.abs(t-8.2)/.14)*.7 + Math.max(0,1-Math.abs(t-8.58)/.22);
}

export function foregroundLeafPose(weather) {
  const t=clamp01((weather-.535)/.115);
  return { visible: weather>.535 && weather<.65, x: 68-54*t+Math.sin(t*Math.PI*2)*14, y:-130+t*275,
    rotation:-65+t*210, scale:.75+Math.sin(t*Math.PI)*.6 };
}

export function keywordPose(progress,index) {
  const enters=[[-1,0],[.23,.39],[.56,.73]], exits=[[.08,.27],[.44,.62],[.80,1]];
  const enter=index===0?1:smooth(...enters[index],progress), exit=smooth(...exits[index],progress);
  return { x:(1-enter)*115, y:-exit*135, rotation:(1-enter)*9-exit*5, opacity:Math.min(1,enter*3)*(1-smooth(.9,1,exit)) };
}

const mix = (a, b, t) => a.map((n, i) => Math.round(n + (b[i] - n) * t));
export function showcasePaper(build, state) {
  let color = mix([245, 242, 217], [228, 235, 201], smooth(.18, .30, build));
  color = mix(color, [206, 232, 234], smooth(.32, .45, build));
  color = mix(color, [245, 242, 217], smooth(.67, .83, build));
  color = mix(color, [119, 137, 153], state.dusk);
  color = mix(color, [233, 202, 149], state.autumn);
  color = mix(color, [210, 228, 231], state.winter);
  return `rgb(${color.join(',')})`;
}
