module.exports = ({ config }) => {
  const isRootDomainBuild = process.env.WEB_DEPLOY_TARGET === 'root';

  return {
    ...config,
    experiments: {
      ...config.experiments,
      baseUrl: isRootDomainBuild
        ? ''
        : (config.experiments?.baseUrl ?? '/imoviral-app-2'),
    },
  };
};
