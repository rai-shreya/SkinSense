import os
from keras.applications import MobileNetV2
from keras.models import Model
from keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from keras.preprocessing.image import ImageDataGenerator
from keras.optimizers import Adam
from keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

# 1. ENHANCED DATA AUGMENTATION
# Accuracy > 95% requires the model to be invariant to lighting and angle.
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=30,
    width_shift_range=0.15,
    height_shift_range=0.15,
    brightness_range=[0.8, 1.2], # Critical for skin tones
    horizontal_flip=True,
    vertical_flip=True,         # Skin patches can be any orientation
    zoom_range=0.3,
    fill_mode='reflect'         # Better for skin textures than 'nearest'
)

valid_datagen = ImageDataGenerator(rescale=1./255)

train_generator = train_datagen.flow_from_directory(
    os.path.join("dataset", "train"),
    target_size=(224, 224),
    batch_size=16, # Smaller batch size often helps convergence in fine-tuning
    class_mode='categorical'
)

valid_generator = valid_datagen.flow_from_directory(
    os.path.join("dataset", "valid"),
    target_size=(224, 224),
    batch_size=16,
    class_mode='categorical'
)

# 2. BUILD MODEL
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224,224,3))

# Start by unfreezing the last 20 layers for specialized feature extraction
# This is the secret to hitting > 95%
base_model.trainable = True
for layer in base_model.layers[:-20]:
    layer.trainable = False

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = BatchNormalization()(x) # Stabilizes training for higher accuracy
x = Dense(256, activation='relu')(x)
x = Dropout(0.4)(x)
predictions = Dense(train_generator.num_classes, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

# 3. ADVANCED COMPILATION
model.compile(
    optimizer=Adam(learning_rate=1e-5), # Lower learning rate for fine-tuning
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# 4. DYNAMIC CALLBACKS
# ReduceLROnPlateau is the "Accuracy Booster"
lr_reducer = ReduceLROnPlateau(
    monitor='val_loss', 
    factor=0.2, 
    patience=3, 
    min_lr=1e-7, 
    verbose=1
)

checkpoint = ModelCheckpoint(
    "model/skin_model.h5", # Use .h5 for better Flask/Socket compatibility
    monitor='val_accuracy',
    save_best_only=True,
    mode='max',
    verbose=1
)

early_stop = EarlyStopping(
    monitor='val_accuracy',
    patience=8,
    restore_best_weights=True
)

# 5. TRAIN
model.fit(
    train_generator,
    validation_data=valid_generator,
    epochs=50, # Give it more room to reach the 95% peak
    callbacks=[checkpoint, early_stop, lr_reducer]
)

model.save("model/skin_model_final.h5")