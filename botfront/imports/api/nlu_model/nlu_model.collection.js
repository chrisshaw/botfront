import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Mongo } from 'meteor/mongo';

import { can, getScopesForUser, checkIfCan } from '../../lib/scopes';
import { Projects } from '../project/project.collection';
import { NLUModelSchema } from './nlu_model.schema';
import { getProjectIdFromModelId } from '../../lib/utils';

export const NLUModels = new Mongo.Collection('nlu_models');

// Deny all client-side updates on the NLUModels collection
NLUModels.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});

Meteor.startup(() => {
    if (Meteor.isServer) {
        NLUModels._ensureIndex({ _id: 1, published: 1 });
    }
});

if (Meteor.isServer) {
    Meteor.publish('nlu_models', function (modelId) {
        check(modelId, String);
        if (can('global-admin')) return NLUModels.find({ _id: modelId });

        const projectId = getProjectIdFromModelId(modelId);

        checkIfCan('nlu-data:r', projectId);

        return NLUModels.find({ _id: modelId });
    });

    // his publication is here to get a lTist of accessible models
    // without having to download all the training data.
    // Thus greatly reducing the load times
    Meteor.publish('nlu_models.lite', function () {
        if (can('global-admin')) {
            return NLUModels.find({}, {
                fields: {
                    language: 1,
                    name: 1,
                    description: 1,
                    training: 1,
                    published: 1,
                },
            });
        }

        const projectIds = getScopesForUser(this.userId, ['nlu-data:r', 'nlu-model:r']);
        const models = Projects.find({ _id: { $in: projectIds } }, { fields: { nlu_models: 1 } }).fetch();
        const modelIdArrays = models.map(m => m.nlu_models);
        const modelIds = [].concat(...modelIdArrays);
        return NLUModels.find(
            { _id: { $in: modelIds } },
            {
                fields: {
                    language: 1,
                    name: 1,
                    description: 1,
                    training: 1,
                    published: 1,
                },
            },
        );
    });

    Meteor.publish('nlu_models.project.training_data', function (projectId) {
        check(projectId, String);
        checkIfCan('[nlu-data:r]', projectId);
        const project = Projects.find({ _id: projectId }, { fields: { nlu_models: 1 } }).fetch();
        const modelIds = project[0].nlu_models;
        return NLUModels.find({ _id: { $in: modelIds } }, { fields: { 'training_data.common_examples': 1 } });
    });
}

NLUModels.attachSchema(NLUModelSchema);
