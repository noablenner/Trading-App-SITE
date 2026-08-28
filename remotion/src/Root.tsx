import React from 'react';
import {Composition, Sequence} from 'remotion';
import {FPS, SCENE_DURATION, VIDEO_HEIGHT, VIDEO_WIDTH} from './tokens';
import {Scene1Hook} from './scenes/Scene1Hook';
import {Scene2Pain} from './scenes/Scene2Pain';
import {Scene3Overview} from './scenes/Scene3Overview';
import {Scene4Seance} from './scenes/Scene4Seance';
import {Scene5Insight} from './scenes/Scene5Insight';
import {Scene6BigStat} from './scenes/Scene6BigStat';
import {Scene7Calendar} from './scenes/Scene7Calendar';
import {Scene8Outro} from './scenes/Scene8Outro';

const scenes = [
  Scene1Hook,
  Scene2Pain,
  Scene3Overview,
  Scene4Seance,
  Scene5Insight,
  Scene6BigStat,
  Scene7Calendar,
  Scene8Outro,
];

export const EdgioStory: React.FC = () => {
  return (
    <>
      {scenes.map((Scene, i) => (
        <Sequence key={i} from={i * SCENE_DURATION} durationInFrames={SCENE_DURATION}>
          <Scene />
        </Sequence>
      ))}
    </>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="EdgioStory"
      component={EdgioStory}
      durationInFrames={scenes.length * SCENE_DURATION}
      fps={FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
    />
  );
};
