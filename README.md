# BET Stack - Bun Express Typescript

Uses bun as environment and package manager.
<br/>
Set the origin to your repository.

## Features

1. Express equipped with dotenv, cors, and cookie-parser.
2. Typescript is equipped with paths.
3. Develop on steroids with Lodash, Prettier, and ESLint already configured.
4. Typscript enabled.
5. Mongoose installed.
6. Zod validation library installed.
7. Tools like bcrypt, uuid, jose installed.
8. Other helping tools like Node Mailer and Unstorage installed.
9. Preconfigured dockerfile and app.yaml to deploy on Google App Engine - configure as you wish!

## Getting Started

1. Replace the package name in package.json and start building
2. Do a `bun install`
3. Checkout the scripts in package.json.

## Some useful guides

1. [Push your docker image to the Goolge Artifact Registery for deployment](https://cloud.google.com/artifact-registry/docs/docker/pushing-and-pulling)
2. [Deploy your app on Google App Engine](https://cloud.google.com/artifact-registry/docs/integrate-app-engine)

## Tips

1. You can put some commonly used commands like build and release commands on a release.sh file and add a script to run in package.json file.
2. Don't forget to set the origin to your repository!!!

## How to build and deploy your app
Make sure you are logged in to your account in gcloud<br/><br/>
1. Create a docker image
```bash
docker build -t <image_name> .
```

2. Test the docker image locally
```bash
docker run -p <host_port>:<port_specified_in_app> run <image_name>
```
> Now you can visit http://localhost<host_port> to see the app running.

3. Login to the gcloud cli
```bash
gcloud auth login
```

4. Select the correct project id
```bash
gcloud config set project <your_google_cloud_project_name>
```

5. Authenticate to your repo
```bash
gcloud auth configure-docker <region_name>-docker.pkg.dev
```

6. Tag the docker image
```bash
docker tag <image_name> <region_name>-docker.pkg.dev/<project_id>/<repository_name>/<image_name>:<tag>
```

7. Push the docker image to the Google Artifact Registry
```bash
docker push <region_name>-docker.pkg.dev/<project_id>/<repository_name>/<image_name>:<tag>
```

8. Deploy the image to the Google App Engine
```bash
gcloud app deploy --image-url=<region_name>-docker.pkg.dev/<project_id>/<repository_name>/<image_name>:<tag>
```

9. Browse your app
```bash
gcloud app browse
```

### Happy Building!
