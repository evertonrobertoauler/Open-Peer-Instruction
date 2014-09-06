'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Classroom Schema
 */
var ClassroomSchema = new Schema({
  name: {
    type: String,
    default: '',
    required: 'Campo Nome é obrigatório',
    trim: true
  },
  students: {
    type: [
      {
        type: Schema.ObjectId,
        ref: 'User'
      }
    ],
  },
  created: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

ClassroomSchema.pre('remove', function(next) {
  mongoose.model('KnowledgeTest').remove({classroom: this._id}).exec();
  next();
});

mongoose.model('Classroom', ClassroomSchema);
