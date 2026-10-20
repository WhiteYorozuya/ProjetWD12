// Chargé avant les imports des tests : ConfigModule valide l'environnement dès l'import d'AppModule.
process.env.JWT_SECRET ??= 'secret-de-test-suffisamment-long-pour-la-validation';
process.env.DATABASE_URL ??= 'postgresql://parcform:parcform@localhost:5432/parcform_test?schema=public';
