
import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { degToRad } from 'three/src/math/MathUtils'

export function Model(props) {
  const { nodes, materials } = useGLTF('/model/BikeFixed.glb')
  return (
    <group rotation={[degToRad(0), degToRad(-90), degToRad(0)]} {...props} scale={0.04} dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Body_Bike_Body_0.geometry}
          material={materials['Bike_Body.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Frame_Bike_Other_0.geometry}
          material={materials['Bike_Other.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['Wheels_Wheels&Cables_0'].geometry}
          material={materials['WheelsCables.001']}
        />
      </group>
    </group>
  )
}

useGLTF.preload('/BikeFixed.glb')
