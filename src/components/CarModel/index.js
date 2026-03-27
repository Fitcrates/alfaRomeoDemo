// Re-export all car model modules
export { DRIVE_MODES, CAR_CONFIG, getCarConfig, createPhysicsState, updateCarPhysics, exportCarState } from './carPhysics'
export { configureCarMaterials, applyCarColor, updateHoodTransparency, updateWheelVisuals, resetWheels, updateIdleWheels } from './carMaterials'
export { default as CarLights } from './carLights'