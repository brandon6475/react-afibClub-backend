
export const initialize = async (models) => {
  const admins = await models.Admin.findAll()
  if (!admins || admins.length === 0) {
    await models.Admin.create({
      email: 'admin@clubafib.com',
      password: 'admin123',
      first_name: 'Admin',
      last_name: 'ClubAfib',
      status: 1,
    })
  }
}